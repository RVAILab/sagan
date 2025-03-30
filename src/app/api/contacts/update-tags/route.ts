import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ClientRequest } from '@sendgrid/client/src/request';

// Import the SendGrid client
import client from '@sendgrid/client';

export async function POST(request: NextRequest) {
  try {
    // Get the request data
    const data = await request.json();
    const { emails, tags } = data;
    
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No emails provided' },
        { status: 400 }
      );
    }
    
    if (typeof tags !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Tags must be a comma-separated string' },
        { status: 400 }
      );
    }
    
    // Configure SendGrid client with API key
    client.setApiKey(process.env.SENDGRID_API_KEY || '');
    
    // Prepare data for SendGrid API
    const sendgridData = {
      contacts: emails.map(email => ({
        email,
        custom_fields: {
          // SendGrid expects 'tags' as a Text type, not an array
          tags
        }
      }))
    };
    
    console.log('Updating tags in SendGrid:', JSON.stringify(sendgridData, null, 2));
    
    // Set up the API request to SendGrid
    const sendgridRequest: ClientRequest = {
      url: '/v3/marketing/contacts',
      method: 'PUT',
      body: sendgridData
    };
    
    // Send the request to SendGrid
    const [response, body] = await client.request(sendgridRequest);
    
    // Check if the response status is successful (2xx)
    const statusCode = response?.statusCode || 500;
    if (statusCode < 200 || statusCode >= 300) {
      console.error('SendGrid API error:', body);
      return NextResponse.json({ 
        success: false, 
        error: `SendGrid API returned status ${statusCode}: ${JSON.stringify(body)}` 
      }, { status: statusCode });
    }
    
    console.log('SendGrid response:', JSON.stringify(body, null, 2));
    
    // Return the result
    return NextResponse.json(
      { success: true, jobId: body.job_id },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error updating tags in SendGrid:', error);
    
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