import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ClientRequest } from '@sendgrid/client/src/request';

// Import the SendGrid client
import client from '@sendgrid/client';

export async function GET(request: NextRequest) {
  try {
    // Configure SendGrid client with API key
    client.setApiKey(process.env.SENDGRID_API_KEY || '');
    
    console.log('Requesting contact export from SendGrid...');
    
    // Start a new export job (with all contacts, no filtering)
    const exportRequest: ClientRequest = {
      url: '/v3/marketing/contacts/exports',
      method: 'POST',
      body: {
        file_type: 'json'
      }
    };
    
    // Send the export request
    const [exportResponse, exportBody] = await client.request(exportRequest);
    
    // Log the response for debugging
    console.log('Export response:', exportResponse.statusCode);
    console.log('Export body:', JSON.stringify(exportBody, null, 2));
    
    // Get the export ID
    const exportId = exportBody?.id;
    
    if (!exportId) {
      return NextResponse.json(
        { success: false, error: 'Failed to start export job' },
        { status: 500 }
      );
    }
    
    // Function to check export status
    const checkExportStatus = async (id: string): Promise<string[]> => {
      const statusRequest: ClientRequest = {
        url: `/v3/marketing/contacts/exports/${id}`,
        method: 'GET'
      };
      
      // Check status until URLs are available
      const [statusResponse, statusBody] = await client.request(statusRequest);
      
      console.log('Status check response:', statusResponse.statusCode);
      console.log('Status body:', JSON.stringify(statusBody, null, 2));
      
      if (statusBody?.urls?.length > 0) {
        return statusBody.urls;
      }
      
      // Wait 2 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 2000));
      return checkExportStatus(id);
    };
    
    // Get the export URLs (may take some time)
    const urls = await checkExportStatus(exportId);
    console.log('Final URLs:', urls);
    
    // Return the URLs as JSON
    return NextResponse.json({
      success: true,
      exportId,
      urls
    });
  } catch (error: unknown) {
    console.error('Error getting contacts from SendGrid:', error);
    
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