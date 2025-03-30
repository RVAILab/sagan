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

### SendGrid Contact Data Structure

Below is an example of the expected CSV structure when exporting contacts from SendGrid:

```csv
email,first_name,last_name,phone_number,address_line_1,city,state_province_region,postal_code,country,tags,region,created_at,updated_at
user1@example.com,John,Doe,555-1234,123 Main St,New York,NY,10001,US,"tag1,tag2",Northeast,2023-01-15T14:30:00Z,2023-01-15T14:30:00Z
user2@example.com,Jane,Smith,555-5678,456 Elm St,Boston,MA,02116,US,"tag2,tag3",Northeast,2023-01-16T09:45:00Z,2023-01-16T09:45:00Z
user3@example.com,Bob,Johnson,555-9012,789 Oak St,Chicago,IL,60601,US,"tag1,tag4",Midwest,2023-01-17T11:15:00Z,2023-01-17T11:15:00Z
```

#### Standard Fields

The application expects and handles the following standard contact fields:

- `email` - Primary identifier, required
- `first_name` - First name of the contact
- `last_name` - Last name of the contact
- `phone_number` - Contact's phone number
- `address_line_1` - Street address
- `city` - City name
- `state_province_region` - State or province
- `postal_code` - ZIP or postal code
- `country` - Country code (e.g., US, CA)
- `created_at` - When the contact was first added
- `updated_at` - When the contact was last updated

#### Special Fields

- `tags` - List of tags attached to the contact, formatted as comma-separated values, often enclosed in quotes
- `region` - Geographic region for categorization

#### Tags Handling

Tags in SendGrid exports can be formatted in different ways:

1. **CSV Format**: `"tag1,tag2,tag3"` (comma-separated values in quotes)
2. **Double-quoted CSV**: `"""tag1"",""tag2"",""tag3"""` (extra quotes around individual tags)
3. **Array Format**: As a JSON array in NDJSON exports

The application handles all these formats by:
- Parsing comma-separated values
- Removing extraneous quotes
- Storing both the original string and a parsed array for flexibility

#### Field Case Sensitivity

The application handles variations in field name capitalization by:
- Converting all field names to lowercase during processing
- Using case-insensitive lookups when accessing fields
- Providing fallbacks for known field variations (e.g., checking both `tags` and `TAGS`)

### Local Storage Caching

The application implements browser localStorage caching for contacts data:

- **Performance Optimization**: Contacts are stored locally to eliminate API calls on repeat visits
- **Offline Support**: Basic browsing of contacts works without an internet connection
- **Intelligent Cache Management**:
  - Cache validity period: 1 hour
  - Background refresh: Occurs automatically for cache older than 10 minutes
  - Visual indicators: UI shows when you're viewing cached data
  - Manual refresh: Force refresh available via refresh button
- **Cache Storage**:
  - Key: `sagan_contacts` - Stores the actual contact data
  - Key: `sagan_contacts_timestamp` - Tracks when data was last updated

This implementation significantly improves page load times while reducing API calls to SendGrid, which may have rate limits.

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
- **Cache indicators**: Visual badge shows when viewing cached data
- **Last updated**: Timestamp shows when contact data was last refreshed

### Filtering and Searching

- **Quick search**: Filter contacts by any field using the search box
- **In-memory filtering**: Instant results without waiting for API calls
- **Works offline**: All filtering and sorting works with cached data

### Selection and Bulk Actions

- **Multi-select**: Choose multiple contacts using checkboxes
- **Batch operations**: Perform actions on multiple contacts at once

### Data Management

- **Manual refresh**: Force refresh contact data from the SendGrid API
- **Background refresh**: Automatic updates for stale data while browsing
- **Cache persistence**: Data remains available between browser sessions

### Contact List Display

The `ContactList` component is responsible for displaying contacts in a tabular format with the following features:

#### Column Display and Customization

- **Dynamic Columns**: Users can select which fields to display via the Columns dropdown menu
- **Default Fields**: Email, First Name, Last Name, and Tags are displayed by default
- **Toggling Visibility**: Any field can be toggled on/off from the columns menu
- **Persistence**: Column preferences are saved to localStorage for future sessions

#### Field Rendering

The component handles different field types appropriately:

- **Tags**: Displayed as colorful badges separated by commas
- **Email**: Displayed as a standard text value with mail-to functionality
- **Names**: First and last names are displayed as text
- **Dates**: Formatted for readability
- **Long Text**: Truncated with ellipsis if too long

#### Case-Insensitive Field Access

The component uses a helper function (`getContactValue`) to access contact fields in a case-insensitive manner:

1. First attempts to access the field with the exact case provided
2. If not found, tries the uppercase version of the field name
3. If still not found, performs a case-insensitive search through all field names

This ensures consistent display even when field names have inconsistent casing in the data.

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

### Working with Cached Data

1. The contacts list initially loads from cache if available (indicated by a "Cached" badge)
2. Last updated timestamp shows when the data was last refreshed
3. Click the "Refresh" button to manually fetch the latest data from SendGrid
4. For most operations, cached data will automatically update in the background if it's older than 10 minutes
5. The application will work offline with cached data for basic browsing, searching, and sorting

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
