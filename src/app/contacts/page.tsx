'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ContactList } from "@/components/ContactList";

export default function ContactsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Contacts</h1>
      <ContactList />
    </div>
  );
} 