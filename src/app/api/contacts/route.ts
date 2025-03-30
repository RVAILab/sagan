import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Import the SendGrid client
const client = require('@sendgrid/client');

export async function POST(request: NextRequest) {
  try {
    // Get form data
    const formData = await request.json();
    
    // Configure SendGrid client with API key
    // NOTE: You should add SENDGRID_API_KEY to your .env.local file
    client.setApiKey(process.env.SENDGRID_API_KEY);
    
    // Prepare data for SendGrid API
    const data = {
      contacts: [
        {
          email: formData.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          city: formData.city || '',
          state_province_region: formData.state || '',
          country: formData.country || '',
          postal_code: formData.postalCode || '',
          phone_number: formData.phone || '',
          // Add tags - SendGrid expects this format
          custom_fields: {
            // This assumes you've created a custom field in SendGrid for 'tags'
            // You may need to adjust the field ID based on your SendGrid account
            tags: formData.tags || []
          }
        }
      ]
    };
    
    console.log('Sending contact to SendGrid:', JSON.stringify(data, null, 2));
    
    // Set up the API request to SendGrid
    const sendgridRequest = {
      url: '/v3/marketing/contacts',
      method: 'PUT',
      body: data
    };
    
    // Send the request to SendGrid
    const [response, body] = await client.request(sendgridRequest);
    
    console.log('SendGrid response:', body);
    
    // Return the result
    return NextResponse.json(
      { success: true, jobId: body.job_id },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error adding contact to SendGrid:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'An error occurred while adding the contact'
      },
      { status: 500 }
    );
  }
} 