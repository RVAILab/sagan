import { NextResponse } from 'next/server';

// Add interface for SendGrid custom field
interface SendGridCustomField {
  id: string;
  name: string;
  field_type: string;
  [key: string]: unknown;
}

export async function GET() {
  try {
    // Get API key from environment
    const apiKey = process.env.SENDGRID_API_KEY;
    
    if (!apiKey) {
      console.error('SENDGRID_API_KEY not found in environment variables');
      return NextResponse.json(
        { success: false, error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Use SendGrid custom fields endpoint
    const customFieldsUrl = 'https://api.sendgrid.com/v3/marketing/field_definitions';
    
    try {
      const response = await fetch(customFieldsUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Handle API errors
      if (!response.ok) {
        console.error('SendGrid API error:', {
          status: response.status,
          statusText: response.statusText
        });
        
        return NextResponse.json(
          { 
            success: false, 
            error: `SendGrid API error: ${response.statusText}`,
            status: response.status
          },
          { status: response.status }
        );
      }
      
      // Parse the successful response
      const data = await response.json();
      
      // Transform the data to make it easier to use
      const customFields = data.custom_fields.map((field: SendGridCustomField) => ({
        id: field.id,
        name: field.name,
        field_type: field.field_type,
        // Use the SendGrid field ID format in our data structure
        key: `cf_${field.id}`
      }));
      
      // Return the custom fields
      return NextResponse.json({
        success: true,
        custom_fields: customFields
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error getting custom fields:', errorMessage);
      
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Server error in custom-fields route:', errorMessage);
    
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
} 