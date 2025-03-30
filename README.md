# Sagan

A streamlined contact management tool for efficient SendGrid contact entry, named after Carl Sagan's novel "Contact".

![Sagan Contact Management](./public/sagan-screenshot.png)

## Overview

Sagan is an internal tool designed to help staff quickly add and update contacts in your SendGrid marketing database. Built with a focus on efficiency and user experience, it streamlines the process of collecting and managing contact information.

## Features

- **Quick Contact Entry**: Add new contacts with just a name and email
- **Duplicate Detection**: Automatically checks if an email already exists in your database
- **Tagging System**: Categorize contacts with quick-add source tags (meetup, partner, etc.)
- **Optional Fields**: Expand the form to add additional details when needed (phone, address)
- **Batch Entry**: Continuous entry mode for adding multiple contacts in succession
- **Keyboard Optimized**: Full keyboard navigation support for rapid data entry
- **Mobile Friendly**: Responsive design works on all devices

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
   git clone https://github.com/yourusername/sagan.git
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

## SendGrid Integration

Sagan integrates with the SendGrid Marketing Campaigns API to manage your contacts:

- **Contact Addition**: Adds new contacts to your SendGrid marketing database
- **Contact Updates**: Updates existing contacts when duplicates are detected
- **Custom Fields**: Supports SendGrid custom fields (particularly for tags)

### Setting Up Your SendGrid Account

1. Create a SendGrid account at [sendgrid.com](https://sendgrid.com/)
2. Generate an API key with Marketing Campaigns permissions
3. Add the API key to your `.env.local` file
4. Configure custom fields in SendGrid if you want to use the tagging feature

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

### Handling Duplicates

When an email already exists in your database:
1. The email field will be highlighted in amber
2. A warning message will appear showing the existing contact's details
3. Continue submitting to update the existing contact
4. A confirmation dialog will appear to confirm the update

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
