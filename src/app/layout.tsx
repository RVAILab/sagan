import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import { Geist, Geist_Mono } from "next/font/google";

const inter = Inter({ subsets: ['latin'] });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Sagan | SendGrid Marketing Contacts API Integration | Internal Use Only',
  description: 'An internal tool for managing marketing contacts with SendGrid',
  keywords: ["Contact Management", "SendGrid", "Next.js", "React", "Tailwind CSS", "RVAI Lab", "Marketing Contacts"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} ${inter.className} antialiased`}>
          <nav className="bg-gray-800 text-white p-4">
            <div className="container mx-auto flex justify-between items-center">
              <Link href="/" className="text-xl font-bold">Sagan</Link>
              <div className="space-x-4">
                <Link href="/" className="hover:text-gray-300">Home</Link>
                <Link href="/contacts" className="hover:text-gray-300">Contacts</Link>
                <Link href="/segments" className="hover:text-gray-300">Segments</Link>
              </div>
            </div>
          </nav>
          <header className="flex justify-end items-center p-4 gap-4 h-16">
            <SignedOut>
              <SignInButton />
              <SignUpButton />
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </header>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
