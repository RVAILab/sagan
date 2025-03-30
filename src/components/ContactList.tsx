'use client';

import { ChangeEvent, useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button
} from "@/components/ui";
import { Search } from 'lucide-react';

interface Contact {
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  address_line_1?: string;
  city?: string;
  state_province_region?: string;
  postal_code?: string;
  country?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: string | undefined;
}

const ContactList = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof Contact>("email");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [usingCachedData, setUsingCachedData] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Fetch contacts from the API
  const fetchContacts = async () => {
    setLoading(true);
    
    try {
      // Check if we have cached contacts
      const cachedData = localStorage.getItem('sagan_contacts');
      const cachedTimestamp = localStorage.getItem('sagan_contacts_timestamp');
      const now = new Date().getTime();
      
      // Use cache if it exists and is less than 1 hour old
      const cacheAge = cachedTimestamp ? now - parseInt(cachedTimestamp) : Infinity;
      const cacheValid = cacheAge < 60 * 60 * 1000; // 1 hour in milliseconds
      
      if (cachedData && cacheValid) {
        console.log('Using cached contacts data from localStorage');
        const parsedData = JSON.parse(cachedData);
        setContacts(parsedData);
        applyFiltersAndSort(parsedData, searchTerm, sortField, sortDirection);
        setLoading(false);
        setUsingCachedData(true);
        
        if (cachedTimestamp) {
          const date = new Date(parseInt(cachedTimestamp));
          setLastUpdated(date.toLocaleString());
        }
        
        // Optionally, refresh in background if cache is older than 10 minutes
        if (cacheAge > 10 * 60 * 1000) {
          console.log('Cache is older than 10 minutes, refreshing in background');
          refreshContactsFromAPI(false);
        }
        
        return;
      }
      
      // If no valid cache, fetch from API
      await refreshContactsFromAPI(true);
      
    } catch (error) {
      console.error('Error fetching contacts:', error);
      setLoading(false);
    }
  };

  // New function to refresh contacts from API
  const refreshContactsFromAPI = async (showLoading: boolean) => {
    if (showLoading) {
      setLoading(true);
    }
    
    setUsingCachedData(false);
    
    try {
      console.log('Starting contacts fetch from API...');
      
      // First start the export job
      const exportResponse = await fetch('/api/contacts/get-all');
      const exportData = await exportResponse.json();
      
      console.log('Export response:', exportData);
      
      if (!exportData.success || !exportData.urls || exportData.urls.length === 0) {
        console.error('Failed to export contacts', exportData);
        if (showLoading) setLoading(false);
        return;
      }
      
      // Download the first URL (for now just handling one file)
      const downloadResponse = await fetch('/api/contacts/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: exportData.urls[0] }),
      });
      
      const downloadData = await downloadResponse.json();
      console.log('Download response:', downloadData);
      
      if (!downloadData.success || !downloadData.data) {
        console.error('Failed to download contacts', downloadData);
        if (showLoading) setLoading(false);
        return;
      }
      
      // Set the contacts
      const fetchedContacts = downloadData.data.contacts || [];
      console.log(`Retrieved ${fetchedContacts.length} contacts from API`);
      
      // Cache the data in localStorage
      localStorage.setItem('sagan_contacts', JSON.stringify(fetchedContacts));
      const timestamp = new Date().getTime();
      localStorage.setItem('sagan_contacts_timestamp', timestamp.toString());
      setLastUpdated(new Date(timestamp).toLocaleString());
      console.log('Contacts data cached to localStorage');
      
      setContacts(fetchedContacts);
      applyFiltersAndSort(fetchedContacts, searchTerm, sortField, sortDirection);
      if (showLoading) setLoading(false);
    } catch (error) {
      console.error('Error refreshing contacts from API:', error);
      if (showLoading) setLoading(false);
    }
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    applyFiltersAndSort(contacts, value, sortField, sortDirection);
  };

  const handleSortChange = (field: keyof Contact) => {
    const newDirection = field === sortField && sortDirection === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortDirection(newDirection);
    applyFiltersAndSort(contacts, searchTerm, field, newDirection);
  };

  const applyFiltersAndSort = (
    data: Contact[],
    search: string,
    sortBy: keyof Contact,
    direction: "asc" | "desc"
  ) => {
    let filtered = data;

    // Apply search filter
    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = data.filter((contact) => {
        return Object.values(contact).some((value) => {
          if (!value) return false;
          return value.toString().toLowerCase().includes(lowerSearch);
        });
      });
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      const aValue = a[sortBy] || "";
      const bValue = b[sortBy] || "";

      if (direction === "asc") {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

    setFilteredContacts(filtered);
  };

  // Fetch contacts on component mount
  useEffect(() => {
    fetchContacts();
    // We only want to fetch contacts on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container mx-auto py-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Contacts</h1>
          {lastUpdated && (
            <div className="text-sm text-gray-500 mt-1 flex items-center">
              <span>Last updated: {lastUpdated}</span>
              {usingCachedData && (
                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                  Cached
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative w-full sm:w-64">
            <Input
              type="text"
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-8 w-full"
            />
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => refreshContactsFromAPI(true)}
              disabled={loading}
              className="text-sm shrink-0"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="text-sm">
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  Name
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Email
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Phone
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Location
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin h-8 w-8 border-4 border-gray-300 rounded-full border-t-blue-600"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className={`cursor-pointer ${sortField === "email" ? "font-bold" : ""}`}
                  onClick={() => handleSortChange("email")}
                >
                  Email {sortField === "email" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead
                  className={`cursor-pointer ${sortField === "first_name" ? "font-bold" : ""}`}
                  onClick={() => handleSortChange("first_name")}
                >
                  First Name {sortField === "first_name" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead
                  className={`cursor-pointer ${sortField === "last_name" ? "font-bold" : ""}`}
                  onClick={() => handleSortChange("last_name")}
                >
                  Last Name {sortField === "last_name" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead
                  className={`cursor-pointer ${sortField === "phone_number" ? "font-bold" : ""}`}
                  onClick={() => handleSortChange("phone_number")}
                >
                  Phone {sortField === "phone_number" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead
                  className={`cursor-pointer ${sortField === "city" ? "font-bold" : ""}`}
                  onClick={() => handleSortChange("city")}
                >
                  City {sortField === "city" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead
                  className={`cursor-pointer ${sortField === "state_province_region" ? "font-bold" : ""}`}
                  onClick={() => handleSortChange("state_province_region")}
                >
                  State {sortField === "state_province_region" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead
                  className={`cursor-pointer ${sortField === "country" ? "font-bold" : ""}`}
                  onClick={() => handleSortChange("country")}
                >
                  Country {sortField === "country" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.length > 0 ? (
                filteredContacts.map((contact, index) => (
                  <TableRow key={index}>
                    <TableCell>{contact.email}</TableCell>
                    <TableCell>{contact.first_name || "-"}</TableCell>
                    <TableCell>{contact.last_name || "-"}</TableCell>
                    <TableCell>{contact.phone_number || "-"}</TableCell>
                    <TableCell>{contact.city || "-"}</TableCell>
                    <TableCell>{contact.state_province_region || "-"}</TableCell>
                    <TableCell>{contact.country || "-"}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    {searchTerm ? "No contacts found matching your search" : "No contacts found"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default ContactList; 