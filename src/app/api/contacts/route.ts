import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ClientRequest } from '@sendgrid/client/src/request';
import { db } from '@/db';
import { contacts } from '@/db/schema';

// Import the SendGrid client
import client from '@sendgrid/client';

export async function POST(request: NextRequest) {
  try {
    // Get form data
    const formData = await request.json();
    
    // Configure SendGrid client with API key
    // NOTE: You should add SENDGRID_API_KEY to your .env.local file
    client.setApiKey(process.env.SENDGRID_API_KEY || '');
    
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
    const sendgridRequest: ClientRequest = {
      url: '/v3/marketing/contacts',
      method: 'PUT',
      body: data
    };
    
    // Send the request to SendGrid
    const [, body] = await client.request(sendgridRequest);
    
    console.log('SendGrid response:', body);
    
    // Store in database using Drizzle
    try {
      await db.insert(contacts).values({
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone
      });
    } catch (dbError) {
      console.error('Error inserting contact into database:', dbError);
      return NextResponse.json({ error: 'Failed to insert contact into database' }, { status: 500 });
    }
    
    // Return the result
    return NextResponse.json(
      { success: true, jobId: body.job_id },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error adding contact to SendGrid:', error);
    
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