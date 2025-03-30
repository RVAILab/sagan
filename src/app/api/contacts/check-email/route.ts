import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Import the SendGrid client
const client = require('@sendgrid/client');

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
    client.setApiKey(process.env.SENDGRID_API_KEY);
    
    // Set up the API request to check if the email exists
    const sendgridRequest = {
      url: `/v3/marketing/contacts/search/emails`,
      method: 'POST',
      body: {
        emails: [email]
      }
    };
    
    console.log('Sending request to SendGrid:', sendgridRequest);
    
    // Send the request to SendGrid
    const [response, body] = await client.request(sendgridRequest);
    
    console.log('SendGrid response status:', response.statusCode);
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
  } catch (error: any) {
    console.error('Error checking email in SendGrid:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'An error occurred while checking the email'
      },
      { status: 500 }
    );
  }
} 