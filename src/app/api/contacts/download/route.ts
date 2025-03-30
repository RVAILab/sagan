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

// We're not using this function anymore, so removing or commenting it
/* 
function parseCSVToContacts(csvData: any) {
  // This would be implemented if we needed to parse CSV
  return [];
}
*/

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

    console.log(`Downloading from URL: ${url}`);

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
      console.log(`Received ${bufferData.length} bytes of compressed data`);
      
      try {
        // Decompress the buffer
        const decompressed = await gunzipAsync(bufferData);
        const dataString = decompressed.toString('utf-8');
        console.log(`Decompressed to ${dataString.length} characters`);

        // Process the NDJSON format from SendGrid
        try {
          const lines = dataString.split('\n');
          const contacts = [];
          
          console.log(`Processing ${lines.length} lines of NDJSON data`);
          
          for (const line of lines) {
            if (line.trim() === '') continue;
            
            try {
              const contact = JSON.parse(line);
              contacts.push(contact);
            } catch {
              // Skip lines that can't be parsed
              console.error('Error parsing JSON line, skipping');
            }
          }
          
          console.log(`Successfully parsed ${contacts.length} contacts`);
          
          return Response.json({ 
            success: true, 
            data: { contacts } 
          });
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          console.error('Failed to parse NDJSON format:', err);
          return Response.json(
            { success: false, error: 'Failed to parse contact data', details: errorMessage },
            { status: 500 }
          );
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('Failed to decompress data:', err);
        return Response.json(
          { success: false, error: 'Failed to decompress data', details: errorMessage },
          { status: 500 }
        );
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Network error fetching from SendGrid:', err);
      return Response.json(
        { success: false, error: 'Network error fetching from SendGrid', details: errorMessage },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error('Server error in download route:', err);
    return Response.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
} 