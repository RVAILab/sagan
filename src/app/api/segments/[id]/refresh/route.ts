import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import client from '@sendgrid/client';
import { ClientRequest } from '@sendgrid/client/src/request';

interface RefreshRouteContext {
  params: Promise<{ id: string }>;
}

// Refresh a segment by ID
export async function POST(
  request: NextRequest,
  context: RefreshRouteContext
) {
  try {
    const resolvedParams = await context.params;
    const segmentId = resolvedParams.id;
    
    // Get the timezone from the request body
    const { user_time_zone } = await request.json();
    
    // Configure SendGrid client with API key
    client.setApiKey(process.env.SENDGRID_API_KEY || '');

    // Prepare data for SendGrid API
    const data = {
      user_time_zone: user_time_zone || "UTC"
    };

    // Set up the API request to SendGrid
    const sendgridRequest: ClientRequest = {
      url: `/v3/marketing/segments/2.0/refresh/${segmentId}`,
      method: 'POST',
      body: data
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

    // Return the result
    return NextResponse.json(
      { success: true, job_id: body.job_id },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error refreshing segment in SendGrid:', error);
    
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