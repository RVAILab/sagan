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
import { Settings, Search } from 'lucide-react';

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