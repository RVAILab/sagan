import { ContactForm } from "@/components/ContactForm";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b py-3">
        <div className="container mx-auto px-4">
          <h1 className="text-lg font-medium">Sagan Communications HQ</h1>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <ContactForm />
      </main>
      
      <footer className="py-4 border-t bg-white">
        <div className="container mx-auto px-4">
          <p className="text-xs text-muted-foreground">
            Sagan | SendGrid Marketing Contacts API Integration | Internal Use Only
          </p>
        </div>
      </footer>
    </div>
  );
}
