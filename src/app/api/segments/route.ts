import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import client from '@sendgrid/client';
import { ClientRequest } from '@sendgrid/client/src/request';

// Get all segments
export async function GET(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _request: NextRequest
) {
  try {
    // Configure SendGrid client with API key
    client.setApiKey(process.env.SENDGRID_API_KEY || '');

    // Set up the API request to SendGrid
    const sendgridRequest: ClientRequest = {
      url: '/v3/marketing/segments/2.0',
      method: 'GET',
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

    // Process segments to extract tag information
    const segments = (body?.results || []).map((segment: Record<string, unknown>) => {
      const processedSegment = { ...segment };
      
      // Extract tags from query_dsl if available
      if (segment.query_dsl) {
        try {
          const tagMatches = (segment.query_dsl as string).match(/tags like '%\\"([^\\"]*)\\"%'/g);
          if (tagMatches) {
            const extractedTags = tagMatches.map((match: string) => {
              const tagMatch = match.match(/tags like '%\\"([^\\"]*)\\"%'/);
              return tagMatch && tagMatch[1];
            }).filter(Boolean);
            
            if (extractedTags.length > 0) {
              processedSegment.tags = extractedTags;
            }
          }
        } catch (err) {
          console.warn(`Failed to extract tags from query_dsl for segment ${segment.id}:`, err);
        }
      }
      
      // Default to empty array if no tags found
      if (!processedSegment.tags) {
        processedSegment.tags = [];
      }
      
      return processedSegment;
    });

    // Return the segments with tag information
    return NextResponse.json({
      success: true,
      segments
    }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error fetching segments from SendGrid:', error);
    
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

// Create a new segment
export async function POST(request: NextRequest) {
  try {
    const formData = await request.json();
    
    // Configure SendGrid client with API key
    client.setApiKey(process.env.SENDGRID_API_KEY || '');

    // Extract tags from form data
    const { name, tags } = formData;
    
    if (!Array.isArray(tags) || tags.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one tag must be selected" },
        { status: 400 }
      );
    }
    
    // Build SQL query for SendGrid based on selected tags
    let tagsCondition;
    
    if (tags.length === 1) {
      // Single tag - use LIKE with escaped double quotes
      tagsCondition = `tags like '%\\"${tags[0]}\\"%'`;
    } else {
      // Multiple tags - use OR condition with multiple LIKE clauses
      tagsCondition = tags
        .map(tag => `tags like '%\\"${tag}\\"%'`)
        .join(' OR ');
    }
    
    const query_dsl = `select contact_id, updated_at from contact_data where ${tagsCondition}`;
    
    // Prepare data for SendGrid API
    const data = {
      name,
      query_dsl
    };
    
    // Set up the API request to SendGrid
    const sendgridRequest: ClientRequest = {
      url: '/v3/marketing/segments/2.0',
      method: 'POST',
      body: data
    };

    // Send the request to SendGrid
    const [response, body] = await client.request(sendgridRequest);

    // Check if the response status is successful (2xx)
    const statusCode = response?.statusCode || 500;
    if (statusCode < 200 || statusCode >= 300) {
      console.error('SendGrid API error:', body);
      console.error('Request payload:', JSON.stringify(data, null, 2));
      return NextResponse.json({ 
        success: false, 
        error: `SendGrid API returned status ${statusCode}: ${JSON.stringify(body)}` 
      }, { status: statusCode });
    }

    // Return the result
    return NextResponse.json({ success: true, id: body.id }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating segment in SendGrid:', error);
    
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