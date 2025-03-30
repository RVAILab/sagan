# Sagan

An AI-centric communications center built on top of Twilio/Sendgrid, named in honor of Carl Sagan's novel "Contact".


## Overview

Sagan is an internal tool designed to help staff quickly add and update contacts, and communicate through email and sms. Built with a focus on efficiency, quality of communications, and user experience, it streamlines the process of staying close to our community.

## Features

- **Quick Contact Entry**: Add new contacts with just a name and email
- **Duplicate Detection**: Automatically checks if an email already exists in your database
- **Tagging System**: Categorize contacts with quick-add source tags (meetup, partner, etc.)
- **Optional Fields**: Expand the form to add additional details when needed (phone, address)
- **Batch Entry**: Continuous entry mode for adding multiple contacts in succession
- **Keyboard Optimized**: Full keyboard navigation support for rapid data entry
- **Mobile Friendly**: Responsive design works on all devices
- **Contacts Management**: Browse, search, sort, and filter your contacts list with customizable columns
- **Bulk Operations**: Select multiple contacts for batch operations
- **Offline Capable**: Contacts are cached locally for faster loading and offline access

## Technology Stack

- **Framework**: Next.js with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with Shadcn UI components
- **Authentication**: Clerk (optional)
- **Database Integration**: SendGrid Marketing Campaigns API

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- SendGrid account with API access
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/RVAILab/sagan.git
   cd sagan
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file with your SendGrid API key:
   ```
   SENDGRID_API_KEY=your_sendgrid_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## SendGrid API Integration

Sagan integrates with the SendGrid Marketing Campaigns API to manage your contacts:

- **Contact Addition**: Adds new contacts to your SendGrid marketing database
- **Contact Updates**: Updates existing contacts when duplicates are detected
- **Contact Search**: Checks if an email already exists in your database
- **Custom Fields**: Supports SendGrid custom fields (particularly for tags)
- **Contact Export**: Retrieves all contacts from SendGrid for listing and filtering

### API Endpoints

Sagan uses the following SendGrid API endpoints:

- `PUT /v3/marketing/contacts` - Add or update contacts
- `POST /v3/marketing/contacts/search/emails` - Check if an email exists
- `POST /v3/marketing/contacts/exports` - Export contacts for listing
- `GET /v3/marketing/contacts/exports/{id}` - Get status of an export job

The contacts listing feature uses the export endpoint to retrieve contacts, as the search endpoint is limited to 50 results. The data is processed on the client side for filtering and sorting to provide a fast, responsive experience.

### Data Processing

The application handles the following data formats from SendGrid:

- NDJSON (Newline Delimited JSON) for contact exports
- Gzipped content for efficient data transfer
- Standard JSON for API responses

### Local Storage Caching

To improve performance and provide limited offline capabilities:

- Contacts data is cached in the browser's localStorage
- Initial page loads use cached data if available and less than 1 hour old
- Background refresh occurs for cached data older than 10 minutes
- Cache reduces API calls to SendGrid and speeds up page loads
- Approximately 5-10MB of storage is used depending on contacts volume

### Setting Up Your SendGrid Account

1. Create a SendGrid account at [sendgrid.com](https://sendgrid.com/)
2. Generate an API key with Marketing Campaigns permissions
3. Add the API key to your `.env.local` file
4. Configure custom fields in SendGrid if you want to use the tagging feature

## Contacts Management

The contacts page provides a comprehensive interface for managing your contacts:

### Viewing Contacts

- **Sort columns**: Click on column headers to sort by that field
- **Customize columns**: Choose which fields to display in the table
- **Responsive design**: Works on both desktop and mobile devices

### Filtering and Searching

- **Quick search**: Filter contacts by any field using the search box
- **In-memory filtering**: Instant results without waiting for API calls

### Selection and Bulk Actions

- **Multi-select**: Choose multiple contacts using checkboxes
- **Batch operations**: Perform actions on multiple contacts at once

## Usage Guide

### Adding Contacts

1. Enter the contact's first name and email (required fields)
2. Add last name if available (optional)
3. Add source tags to track how the contact heard about you
4. Click "Add Contact" to submit

### Using Tags

1. Use the quick-add buttons for common sources (meetup, partner, etc.)
2. Type custom tags in the input field
3. Press Enter or click "Add" to add the custom tag
4. Click the "×" on a tag to remove it

### Adding Additional Information

1. Click "+ Add address fields" to show additional fields
2. Enter phone number, city, state, postal code, and/or country
3. Click "- Hide address fields" to collapse the section

### Managing Contacts

1. Navigate to the Contacts page from the main navigation
2. Use the search box to filter contacts by any field
3. Click column headers to sort by that field
4. Use the Columns button to customize which fields are displayed
5. Check boxes next to contacts to select them for batch operations

## Deployment

Sagan can be deployed to Vercel or any other Next.js-compatible hosting service.

To deploy to Vercel:

1. Push your code to a Git repository
2. Import the project to Vercel
3. Add your environment variables (SENDGRID_API_KEY)
4. Deploy

## Contributing

Contributions are welcome! Please feel free to submit a pull request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
