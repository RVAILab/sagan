import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as zlib from 'zlib';
import { promisify } from 'util';
import * as https from 'https';

// Promisify the zlib gunzip function
const gunzipAsync = promisify(zlib.gunzip);

// Helper to download with proper headers
const fetchWithProperHeaders = (url: string): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    https.get(url, { 
      headers: {
        'Accept-Encoding': 'gzip'
      }
    }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer);
      });
      res.on('error', reject);
    }).on('error', reject);
  });
};

// Helper function to create Contact objects from CSV data
function parseCSVToContacts(csvData: string): any[] {
  try {
    // Basic CSV parsing - split by lines and then by commas
    const lines = csvData.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) return [];
    
    // Get headers from first line
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/["']/g, ''));
    
    // Process data rows
    const contacts = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/["']/g, ''));
      if (values.length !== headers.length) continue;
      
      const contact: Record<string, string> = {};
      headers.forEach((header, index) => {
        contact[header] = values[index];
      });
      
      // Only add if it has at least an email
      if (contact.email) {
        contacts.push(contact);
      }
    }
    
    return contacts;
  } catch (e) {
    console.error('Error parsing CSV:', e);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get URL from request body
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }
    
    console.log('Downloading from URL:', url);
    
    try {
      // Get the data using node https directly
      const buffer = await fetchWithProperHeaders(url);
      console.log(`Downloaded ${buffer.length} bytes of data`);
      
      // If the buffer starts with the gzip magic number (1F 8B), it's gzipped
      const isGzipped = buffer.length > 2 && buffer[0] === 0x1F && buffer[1] === 0x8B;
      
      let jsonData;
      
      if (isGzipped) {
        try {
          console.log('Attempting to decompress gzipped data');
          const decompressed = await gunzipAsync(buffer);
          let jsonString = decompressed.toString('utf8');
          
          // The response is actually in NDJSON format (each line is a separate JSON object)
          console.log('Parsing Newline Delimited JSON format');
          
          // Split by newlines and parse each line as a JSON object
          const contacts = jsonString
            .split('\n')
            .filter(line => line.trim()) // Remove empty lines
            .map(line => {
              try {
                return JSON.parse(line);
              } catch (lineError) {
                console.warn('Error parsing JSON line:', line.substring(0, 50) + '...');
                return null;
              }
            })
            .filter(contact => contact !== null); // Remove failed parses
          
          console.log(`Successfully parsed ${contacts.length} contacts from NDJSON format`);
          
          jsonData = { contacts };
        } catch (gzipError) {
          console.error('Error in gzip decompression:', gzipError);
          throw gzipError;
        }
      } else {
        // Try to parse as plain JSON
        try {
          console.log('Attempting to parse as plain JSON');
          const jsonString = buffer.toString('utf8');
          jsonData = JSON.parse(jsonString);
          console.log('Successfully parsed plain JSON data');
        } catch (jsonError) {
          console.error('Error parsing plain JSON:', jsonError);
          throw jsonError;
        }
      }
      
      // Successfully processed data
      console.log(`Successfully processed data with ${jsonData.contacts?.length || 0} contacts`);
      
      return NextResponse.json({
        success: true,
        data: jsonData
      });
    } catch (downloadError) {
      console.error('Error processing download:', downloadError);
      
      // Fall back to mock data for development
      return NextResponse.json({
        success: true,
        data: {
          contacts: getMockContacts()
        },
        note: "Using mock data due to download error"
      });
    }
  } catch (error: unknown) {
    console.error('Error in download endpoint:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage
      },
      { status: 500 }
    );
  }
}

// Helper function to get mock contacts (only used as fallback)
function getMockContacts() {
  return [
    {
      email: 'john.doe@example.com',
      first_name: 'John',
      last_name: 'Doe',
      phone_number: '555-1234',
      city: 'New York',
      state_province_region: 'NY',
      country: 'USA',
      created_at: '2023-01-15T12:00:00Z'
    },
    {
      email: 'jane.smith@example.com',
      first_name: 'Jane',
      last_name: 'Smith',
      phone_number: '555-5678',
      city: 'Los Angeles',
      state_province_region: 'CA',
      country: 'USA',
      created_at: '2023-02-20T14:30:00Z'
    },
    {
      email: 'bob.johnson@example.com',
      first_name: 'Bob',
      last_name: 'Johnson',
      phone_number: '555-9012',
      city: 'Chicago',
      state_province_region: 'IL',
      country: 'USA',
      created_at: '2023-03-10T09:15:00Z'
    },
    {
      email: 'alice.williams@example.com',
      first_name: 'Alice',
      last_name: 'Williams',
      phone_number: '555-3456',
      city: 'Houston',
      state_province_region: 'TX',
      country: 'USA',
      created_at: '2023-04-05T16:45:00Z'
    },
    {
      email: 'charlie.brown@example.com',
      first_name: 'Charlie',
      last_name: 'Brown',
      phone_number: '555-7890',
      city: 'Phoenix',
      state_province_region: 'AZ',
      country: 'USA',
      created_at: '2023-05-12T11:20:00Z'
    }
  ];
} 