import { NextResponse } from 'next/server';

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

    // Use SendGrid export endpoint to get all contacts
    const exportUrl = 'https://api.sendgrid.com/v3/marketing/contacts/exports';
    
    try {
      const response = await fetch(exportUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // Request all fields for each contact
          field_selections: ["*"]
        })
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
      
      // The response includes an ID for the export job
      if (!data.id) {
        return NextResponse.json(
          { success: false, error: 'No export ID returned from SendGrid' },
          { status: 500 }
        );
      }
      
      // Now we need to get the status of the export job
      const statusUrl = `https://api.sendgrid.com/v3/marketing/contacts/exports/${data.id}`;
      
      // Wait for the export job to complete (this can take a few seconds)
      let exportComplete = false;
      let exportData = null;
      let attempts = 0;
      const MAX_ATTEMPTS = 10; // Maximum number of attempts to check status
      
      while (!exportComplete && attempts < MAX_ATTEMPTS) {
        attempts++;
        
        // Sleep for 1 second between attempts
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const statusResponse = await fetch(statusUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        });
        
        if (!statusResponse.ok) {
          console.error('Error checking export status:', statusResponse.statusText);
          continue;
        }
        
        exportData = await statusResponse.json();
        
        // Check if the export is complete
        if (exportData.status === 'ready') {
          exportComplete = true;
        }
      }
      
      // If we reached max attempts without completion
      if (!exportComplete) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Export is taking too long to complete', 
            status: exportData?.status || 'unknown'
          },
          { status: 408 } // Request Timeout
        );
      }
      
      // Return the download URLs for the exported contacts
      return NextResponse.json({
        success: true,
        urls: exportData.urls,
        exportId: data.id
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error getting all contacts:', errorMessage);
      
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Server error in get-all route:', errorMessage);
    
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
} 