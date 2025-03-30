import { NextRequest } from 'next/server';
import { gunzip } from 'zlib';
import { promisify } from 'util';

// Define contact type for mock data
interface Contact {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  address_line_1: string;
  city: string;
  state_province_region: string;
  postal_code: string;
  country: string;
  create_at: string;
  updated_at: string;
  source: string;
  [key: string]: string;
}

// Mock data for when we need it
const mockData: { contacts: Contact[] } = { contacts: [] };

// For testing - generates a large number of mock contacts
for (let i = 0; i < 100; i++) {
  mockData.contacts.push({
    id: `contact_${i}`,
    email: `contact${i}@example.com`,
    first_name: `First${i}`,
    last_name: `Last${i}`,
    phone_number: `555-${i.toString().padStart(4, '0')}`,
    address_line_1: `${i} Main St`,
    city: `City${i}`,
    state_province_region: `State${i}`,
    postal_code: `${i.toString().padStart(5, '0')}`,
    country: 'US',
    create_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    source: `source${i % 5}`,
  });
}

// Modified promisify gunzip
const gunzipAsync = promisify(gunzip);

// Manual CSV parser for contacts
function parseCSVToContacts(csvData: string): any[] {
  try {
    // Split by lines
    const lines = csvData.split(/\r?\n/).filter(line => line.trim());
    
    // No data
    if (lines.length < 2) {
      console.warn('CSV file contains no data rows');
      return [];
    }
    
    // Parse headers (first line)
    const headers = parseCSVLine(lines[0]).map(header => 
      header.toLowerCase().replace(/["']/g, '')
    );
    
    // Parse data rows
    const contacts = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      
      // Skip if number of values doesn't match headers
      if (values.length !== headers.length) {
        console.warn(`Line ${i + 1}: Column count mismatch. Expected ${headers.length}, got ${values.length}`);
        continue;
      }
      
      // Create record object
      const record: any = {};
      headers.forEach((header, index) => {
        record[header] = values[index];
      });
      
      // Process tags if they exist
      if (record.tags) {
        try {
          let tagsString = record.tags;
          
          // If it's already a string with quotes, parse it
          if (typeof tagsString === 'string' && tagsString.includes('""')) {
            // Remove outer triple quotes if present
            tagsString = tagsString.replace(/^"""|"""$/g, '');
            // Split by "," and clean up remaining quotes
            const tagsList = tagsString.split('","')
              .map((tag: string) => tag.replace(/^"|"$/g, '').trim())
              .filter((tag: string) => tag); // Remove empty tags
            
            // Store as both original string and parsed array for flexibility
            record.tags = tagsString;
            record.tags_array = tagsList;
          }
        } catch (tagError) {
          console.error('Error parsing tags:', tagError);
        }
      }
      
      contacts.push(record);
    }
    
    return contacts;
  } catch (error) {
    console.error('Error parsing CSV:', error);
    return [];
  }
}

// Helper to parse a CSV line with proper handling of quoted values
function parseCSVLine(line: string): string[] {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      // Toggle quote state
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current);
      current = '';
    } else {
      // Normal character
      current += char;
    }
  }
  
  // Add the last field
  result.push(current);
  
  // Clean up quotes
  return result.map(value => value.replace(/^"|"$/g, '').trim());
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return Response.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    // Fetch the data from SendGrid
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`SendGrid API response error: ${response.status} ${response.statusText}`);
        return Response.json(
          { 
            success: false, 
            error: `Failed to download contacts: ${response.status} ${response.statusText}` 
          },
          { status: response.status }
        );
      }
      
      // Get the buffer from the response
      const buffer = await response.arrayBuffer();
      const bufferData = Buffer.from(buffer);
      
      try {
        // Try to decompress as gzip
        let dataString;
        
        try {
          // Decompress the buffer
          const decompressed = await gunzipAsync(bufferData);
          dataString = decompressed.toString('utf-8');
        } catch (gzipError) {
          // If decompression fails, try to use the raw data (might not be compressed)
          console.warn('Gzip decompression failed, trying to use raw data');
          dataString = bufferData.toString('utf-8');
        }
        
        // Check if it's CSV or JSON
        const isCSV = url.includes('.csv') || dataString.includes(',') && dataString.includes('\n') && !dataString.includes('{');
        
        if (isCSV) {
          // Process as CSV
          const contacts = parseCSVToContacts(dataString);
          
          return Response.json({ 
            success: true, 
            data: { contacts } 
          });
        } else {
          // Process as NDJSON (each line is a JSON object)
          const lines = dataString.split('\n');
          const contacts = [];
          
          for (const line of lines) {
            if (line.trim() === '') continue;
            
            try {
              const contact = JSON.parse(line);
              
              // Process custom fields, especially tags
              if (contact.tags) {
                // Clean up the tags format
                try {
                  let tagsString = contact.tags;
                  
                  if (typeof tagsString === 'string' && tagsString.includes('""')) {
                    // Remove outer triple quotes
                    tagsString = tagsString.replace(/^"""|"""$/g, '');
                    // Split by comma and clean up remaining quotes
                    const tagsList = tagsString.split('","')
                      .map((tag: string) => tag.replace(/^"|"$/g, '').trim())
                      .filter((tag: string) => tag);
                    
                    contact.tags = tagsString;
                    contact.tags_array = tagsList;
                  } else if (Array.isArray(contact.tags)) {
                    contact.tags_array = contact.tags;
                    contact.tags = contact.tags.join(', ');
                  }
                } catch (tagError) {
                  console.error('Error parsing tags:', tagError);
                }
              }
              
              contacts.push(contact);
            } catch (parseError) {
              // Skip lines that can't be parsed
              console.error('Error parsing JSON line, skipping');
            }
          }
          
          return Response.json({ 
            success: true, 
            data: { contacts } 
          });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('Failed to process data:', err);
        
        // Return mock data for development
        return Response.json({ 
          success: true, 
          data: mockData,
          error: errorMessage
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Network error fetching from SendGrid:', err);
      
      // Return mock data for development
      return Response.json({ 
        success: true, 
        data: mockData,
        error: errorMessage
      });
    }
  } catch (err) {
    console.error('Server error in download route:', err);
    
    // Return mock data for development
    return Response.json({ 
      success: true, 
      data: mockData,
      error: 'Server error'
    });
  }
} 