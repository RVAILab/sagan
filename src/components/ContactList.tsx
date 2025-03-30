'use client';

import { useState, useEffect } from 'react';
import { 
  Button,
  Input,
  Card,
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
  Skeleton,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui";
import { Settings } from 'lucide-react';

interface Contact {
  id?: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  city?: string;
  state_province_region?: string;
  country?: string;
  postal_code?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

interface ContactListProps {
  initialContacts?: Contact[];
}

// Define all available columns
const ALL_COLUMNS = [
  { id: 'email', label: 'Email' },
  { id: 'first_name', label: 'First Name' },
  { id: 'last_name', label: 'Last Name' },
  { id: 'phone_number', label: 'Phone' },
  { id: 'city', label: 'City' },
  { id: 'state_province_region', label: 'State' },
  { id: 'country', label: 'Country' },
  { id: 'postal_code', label: 'Postal Code' },
  { id: 'created_at', label: 'Created' },
  { id: 'updated_at', label: 'Updated' },
];

export function ContactList({ initialContacts = [] }: ContactListProps) {
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>(contacts);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<string>('email');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set([
    'email', 'first_name', 'last_name', 'phone_number'
  ]));
  const [exportUrls, setExportUrls] = useState<string[]>([]);
  const [exportStatus, setExportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // Fetch contacts from the API
  const fetchContacts = async () => {
    setLoading(true);
    try {
      console.log('Starting contacts fetch...');
      
      // First start the export job
      const exportResponse = await fetch('/api/contacts/get-all');
      const exportData = await exportResponse.json();
      
      console.log('Export response:', exportData);
      
      if (!exportData.success || !exportData.urls || exportData.urls.length === 0) {
        console.error('Failed to export contacts', exportData);
        setLoading(false);
        return;
      }
      
      setExportUrls(exportData.urls);
      console.log(`Got ${exportData.urls.length} export URLs`);
      
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
        setLoading(false);
        return;
      }
      
      // Set the contacts
      const fetchedContacts = downloadData.data.contacts || [];
      console.log(`Retrieved ${fetchedContacts.length} contacts`);
      
      setContacts(fetchedContacts);
      applyFiltersAndSort(fetchedContacts, searchTerm, sortField, sortDirection);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      setLoading(false);
    }
  };

  // Apply filters and sorting
  const applyFiltersAndSort = (
    contactsList: Contact[], 
    search: string, 
    field: string, 
    direction: 'asc' | 'desc'
  ) => {
    // Filter contacts
    const filtered = search 
      ? contactsList.filter(contact => {
          const searchLower = search.toLowerCase();
          return (
            (contact.email && contact.email.toLowerCase().includes(searchLower)) ||
            (contact.first_name && contact.first_name.toLowerCase().includes(searchLower)) ||
            (contact.last_name && contact.last_name.toLowerCase().includes(searchLower)) ||
            (contact.phone_number && contact.phone_number.includes(search))
          );
        })
      : [...contactsList];
    
    // Sort contacts
    const sorted = [...filtered].sort((a, b) => {
      const aValue = a[field] || '';
      const bValue = b[field] || '';
      
      if (direction === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });
    
    setFilteredContacts(sorted);
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    applyFiltersAndSort(contacts, value, sortField, sortDirection);
  };

  // Handle sorting when clicking column headers
  const handleSort = (field: string) => {
    const newDirection = field === sortField && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
    applyFiltersAndSort(contacts, searchTerm, field, newDirection);
  };

  // Toggle column visibility
  const toggleColumn = (column: string) => {
    const newColumns = new Set(visibleColumns);
    if (newColumns.has(column)) {
      // Don't allow removing the email column - it's required
      if (column !== 'email') {
        newColumns.delete(column);
      }
    } else {
      newColumns.add(column);
    }
    setVisibleColumns(newColumns);
  };

  // Toggle selection of a contact
  const toggleContactSelection = (email: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(email)) {
      newSelected.delete(email);
    } else {
      newSelected.add(email);
    }
    setSelectedContacts(newSelected);
  };

  // Toggle selection of all contacts
  const toggleSelectAll = () => {
    if (selectedContacts.size === filteredContacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(filteredContacts.map(c => c.email)));
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchContacts();
  }, []);

  // Loading state UI
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-10 w-[150px]" />
        </div>
        <div className="border rounded-md">
          <div className="flex items-center p-4 border-b">
            <Skeleton className="h-4 w-4 mr-2" />
            <Skeleton className="h-4 w-[100px] mr-4" />
            <Skeleton className="h-4 w-[150px] mr-4" />
            <Skeleton className="h-4 w-[150px] mr-4" />
            <Skeleton className="h-4 w-[120px]" />
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center p-4 border-b">
              <Skeleton className="h-4 w-4 mr-2" />
              <Skeleton className="h-4 w-[100px] mr-4" />
              <Skeleton className="h-4 w-[150px] mr-4" />
              <Skeleton className="h-4 w-[150px] mr-4" />
              <Skeleton className="h-4 w-[120px]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="w-full sm:w-1/3">
          <Input
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full"
          />
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => fetchContacts()}
          >
            Refresh
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {ALL_COLUMNS.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={visibleColumns.has(column.id)}
                  onCheckedChange={() => toggleColumn(column.id)}
                  disabled={column.id === 'email'} // Email is required
                >
                  {column.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <input
                  type="checkbox"
                  checked={selectedContacts.size === filteredContacts.length && filteredContacts.length > 0}
                  onChange={toggleSelectAll}
                  className="h-4 w-4"
                />
              </TableHead>
              {ALL_COLUMNS.filter(col => visibleColumns.has(col.id)).map(column => (
                <TableHead 
                  key={column.id}
                  className="cursor-pointer"
                  onClick={() => handleSort(column.id)}
                >
                  {column.label} {sortField === column.id && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={1 + visibleColumns.size} className="h-24 text-center">
                  No contacts found
                </TableCell>
              </TableRow>
            ) : (
              filteredContacts.map((contact) => (
                <TableRow key={contact.email}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedContacts.has(contact.email)}
                      onChange={() => toggleContactSelection(contact.email)}
                      className="h-4 w-4"
                    />
                  </TableCell>
                  {ALL_COLUMNS.filter(col => visibleColumns.has(col.id)).map(column => (
                    <TableCell key={column.id}>
                      {column.id === 'created_at' || column.id === 'updated_at'
                        ? (contact[column.id] 
                            ? new Date(contact[column.id] as string).toLocaleDateString() 
                            : '-')
                        : (contact[column.id] || '-')}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
      
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">
            {selectedContacts.size} selected of {filteredContacts.length} contacts
          </p>
        </div>
        <div className="flex gap-2">
          {selectedContacts.size > 0 && (
            <Button variant="destructive" size="sm">
              Delete Selected
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 