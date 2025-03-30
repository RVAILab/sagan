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

interface SendGridResponse {
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
    
    // Set up the API request to check if the email exists
    const sendgridRequest: ClientRequest = {
      url: `/v3/marketing/contacts/search/emails`,
      method: 'POST',
      body: {
        emails: [email]
      }
    };
    
    console.log('Sending request to SendGrid:', sendgridRequest);
    
    // Send the request to SendGrid
    const [response, body] = await client.request(sendgridRequest) as [unknown, SendGridResponse];
    
    console.log('SendGrid response status:', response);
    console.log('SendGrid response body:', JSON.stringify(body, null, 2));
    
    // Check if the email exists - corrected logic for object structure
    const exists = body && 
      body.result && 
      body.result[email] && 
      body.result[email].contact !== null;
    
    console.log('Email exists?', exists);
    
    // Get contact details
    let contactDetails = null;
    if (exists && body.result[email]) {
      contactDetails = body.result[email].contact;
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