import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ClientRequest } from '@sendgrid/client/src/request';

// Import the SendGrid client
import client from '@sendgrid/client';

export async function GET(request: NextRequest) {
  try {
    // Get the job_id from the URL
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('job_id');
    
    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'job_id parameter is required' },
        { status: 400 }
      );
    }
    
    // Configure SendGrid client with API key
    client.setApiKey(process.env.SENDGRID_API_KEY || '');
    
    // Set up the API request to check the job status
    const sendgridRequest: ClientRequest = {
      url: `/v3/marketing/contacts/imports/${jobId}`,
      method: 'GET'
    };
    
    console.log('Checking job status for:', jobId);
    
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
    
    console.log('SendGrid job status response:', JSON.stringify(body, null, 2));
    
    // Add enhanced error information if available
    let errorInfo: {
      erroredCount: number;
      requestedCount: number;
      errorDetails: string;
      errorMessage?: string;
    } | null = null;
    
    if (body.results && body.results.errored_count > 0) {
      errorInfo = {
        erroredCount: body.results.errored_count,
        requestedCount: body.results.requested_count,
        errorDetails: 'There were errors processing this contact. Check the errors_url in the full response for details.'
      };
      
      // Add a user-friendly error message for common issues
      if (body.status === 'failed') {
        errorInfo.errorMessage = "The contact submission failed. This could be due to invalid field formats or missing required data.";
      } else if (body.status === 'pending' && body.results.errored_count > 0) {
        errorInfo.errorMessage = "There were some errors with the submission, but it might still be processing.";
      }
    }
    
    // Return the job status with enhanced error info
    return NextResponse.json({
      success: true,
      status: body,
      errorInfo
    }, { status: 200 });
    
  } catch (error: unknown) {
    console.error('Error checking job status in SendGrid:', error);
    
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