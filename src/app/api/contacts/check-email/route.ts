import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ClientRequest } from '@sendgrid/client/src/request';

// Import the SendGrid client
import client from '@sendgrid/client';

interface SendGridContact {
  first_name?: string;
  last_name?: string;
  email: string;
  [key: string]: unknown;
}

interface SendGridSearchEmailsResponse {
  result: {
    [email: string]: {
      contact: SendGridContact | null;
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    // Get email from request body
    const { email } = await request.json();
    
    console.log('Checking email:', email);
    
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Configure SendGrid client with API key
    client.setApiKey(process.env.SENDGRID_API_KEY || '');
    
    // First try the emails search endpoint
    try {
      // Set up the API request to check if the email exists
      const emailsSearchRequest: ClientRequest = {
        url: `/v3/marketing/contacts/search/emails`,
        method: 'POST',
        body: {
          emails: [email.toLowerCase()]
        }
      };
      
      console.log('Sending request to SendGrid emails endpoint:', emailsSearchRequest);
      
      // Send the request to SendGrid
      const [response, body] = await client.request(emailsSearchRequest) as [any, SendGridSearchEmailsResponse];
      
      console.log('SendGrid response status:', response?.statusCode);
      
      if (response?.statusCode === 200) {
        // Check if the email exists
        const exists = body && 
          body.result && 
          body.result[email.toLowerCase()] && 
          body.result[email.toLowerCase()].contact !== null;
        
        console.log('Email exists?', exists);
        
        // Get contact details
        let contactDetails = null;
        if (exists && body.result[email.toLowerCase()]) {
          contactDetails = body.result[email.toLowerCase()].contact;
          console.log('Contact details found:', contactDetails);
        }
        
        // Return the result
        return NextResponse.json(
          { 
            success: true, 
            exists, 
            contactDetails
          },
          { status: 200 }
        );
      }
    } catch (emailSearchError) {
      console.log('Search by emails endpoint failed, trying general search:', emailSearchError);
      // Continue to try the general search endpoint
    }
    
    // If the emails search fails, fall back to the general search
    // Set up the API request to search by query
    const searchRequest: ClientRequest = {
      url: `/v3/marketing/contacts/search`,
      method: 'POST',
      body: {
        query: `email LIKE '${email.toLowerCase()}'`
      }
    };
    
    console.log('Sending request to SendGrid search endpoint:', searchRequest);
    
    // Send the request to SendGrid
    const [searchResponse, searchBody] = await client.request(searchRequest) as [any, any];
    
    console.log('SendGrid search response status:', searchResponse?.statusCode);
    console.log('SendGrid search response body:', JSON.stringify(searchBody, null, 2));
    
    // Check if the email exists by looking at the contact_count
    const exists = searchBody && 
                 searchBody.contact_count && 
                 searchBody.contact_count > 0 &&
                 searchBody.result && 
                 searchBody.result.length > 0;
    
    console.log('Email exists (via search)?', exists);
    
    // Get contact details from the first result
    let contactDetails = null;
    if (exists && searchBody.result && searchBody.result.length > 0) {
      contactDetails = searchBody.result[0];
      console.log('Contact details found (via search):', contactDetails);
    }
    
    // Return the result
    return NextResponse.json(
      { 
        success: true, 
        exists, 
        contactDetails
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error checking email in SendGrid:', error);
    
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