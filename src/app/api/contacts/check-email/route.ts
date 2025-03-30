import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define expected response types
interface ContactMatch {
  id: string;
  contact: {
    email: string;
    [key: string]: string | undefined;
  };
}

interface SearchResponse {
  result: ContactMatch[];
}

interface ErrorResponse {
  message: string;
  field?: string;
  errorId?: string;
  [key: string]: unknown;
}

// Helper function to validate email format
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export async function POST(request: NextRequest) {
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
    
    // Parse the request body
    const body = await request.json();
    const { email } = body;
    
    // Validate email
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }
    
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }
    
    // Prepare the request to SendGrid
    const searchUrl = 'https://api.sendgrid.com/v3/marketing/contacts/search/emails';
    const searchPayload = {
      emails: [email]
    };
    
    try {
      const response = await fetch(searchUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(searchPayload)
      });
      
      // Handle API errors
      if (!response.ok) {
        const errorText = await response.text();
        let errorInfo: ErrorResponse;
        
        try {
          errorInfo = JSON.parse(errorText) as ErrorResponse;
        } catch {
          errorInfo = { message: errorText || 'Unknown error' };
        }
        
        console.error('SendGrid API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorInfo
        });
        
        return NextResponse.json(
          { 
            success: false, 
            error: `SendGrid API error: ${errorInfo.message || response.statusText}`,
            status: response.status
          },
          { status: response.status }
        );
      }
      
      // Parse the successful response
      const data = await response.json() as SearchResponse;
      const exists = data.result.length > 0;
      const matchedContact = exists ? data.result[0].contact : null;
      
      return NextResponse.json({
        success: true,
        exists,
        contact: matchedContact
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error checking email:', errorMessage);
      
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Server error in check-email route:', errorMessage);
    
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
} 