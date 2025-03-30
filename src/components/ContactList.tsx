'use client';

import { ChangeEvent, useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
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
import { Search, MoreVertical } from 'lucide-react';

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
  tags?: string;
  tags_array?: string[];
  region?: string;
  added_date?: string;
}

// Define column configuration
interface Column {
  key: keyof Contact;
  label: string;
}

// Initial standard columns - include all possible standard fields here
const STANDARD_COLUMNS: Column[] = [
  { key: "email", label: "Email" },
  { key: "first_name", label: "First Name" },
  { key: "last_name", label: "Last Name" },
  { key: "phone_number", label: "Phone" },
  { key: "tags", label: "Tags" },
  { key: "region", label: "Region" },
  { key: "city", label: "City" },
  { key: "state_province_region", label: "State" },
  { key: "country", label: "Country" },
  { key: "address_line_1", label: "Address" },
  { key: "postal_code", label: "Postal Code" },
  { key: "created_at", label: "Created Date" },
  { key: "updated_at", label: "Updated Date" },
  { key: "added_date", label: "Added Date" }
];

const ContactList = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof Contact>("email");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [usingCachedData, setUsingCachedData] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<Set<keyof Contact>>(
    new Set(["email", "first_name", "last_name", "tags"])
  );
  // Add state for selected contacts and tag management
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [tagInput, setTagInput] = useState('');
  const [isUpdatingTags, setIsUpdatingTags] = useState(false);
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [tagOperation, setTagOperation] = useState<'add'|'remove'|'replace'>('add');
  const [oldTagValue, setOldTagValue] = useState('');
  const [newTagValue, setNewTagValue] = useState('');
  const [tagActionError, setTagActionError] = useState('');
  const [tagActionSuccess, setTagActionSuccess] = useState('');

  // Toggle column visibility
  const toggleColumn = (column: keyof Contact) => {
    const newVisibleColumns = new Set(visibleColumns);
    
    if (newVisibleColumns.has(column)) {
      // Don't allow hiding email - it's the primary identifier
      if (column !== "email") {
        newVisibleColumns.delete(column);
      }
    } else {
      newVisibleColumns.add(column);
    }
    
    setVisibleColumns(newVisibleColumns);
    
    // Save visible columns preference to localStorage
    localStorage.setItem('sagan_visible_columns', JSON.stringify(Array.from(newVisibleColumns)));
  };

  // Fetch contacts from the API
  const fetchContacts = async () => {
    setLoading(true);
    
    try {
      // Check if we have cached columns preference
      const columnsPreference = localStorage.getItem('sagan_visible_columns');
      if (columnsPreference) {
        try {
          const savedColumns = JSON.parse(columnsPreference) as Array<keyof Contact>;
          setVisibleColumns(new Set(savedColumns));
        } catch (e) {
          console.error('Error parsing saved columns preference:', e);
        }
      }
      
      // Check if we have cached contacts
      const cachedData = localStorage.getItem('sagan_contacts');
      const cachedTimestamp = localStorage.getItem('sagan_contacts_timestamp');
      const now = new Date().getTime();
      
      // Use cache if it exists and is less than 1 hour old
      const cacheAge = cachedTimestamp ? now - parseInt(cachedTimestamp) : Infinity;
      const cacheValid = cacheAge < 60 * 60 * 1000; // 1 hour in milliseconds
      
      if (cachedData && cacheValid) {
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
      // First start the export job
      const exportResponse = await fetch('/api/contacts/get-all');
      const exportData = await exportResponse.json();
      
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
      
      if (!downloadData.success || !downloadData.data) {
        console.error('Failed to download contacts', downloadData);
        if (showLoading) setLoading(false);
        return;
      }
      
      // Set the contacts
      const fetchedContacts = downloadData.data.contacts || [];
      
      // Cache the data in localStorage
      localStorage.setItem('sagan_contacts', JSON.stringify(fetchedContacts));
      const timestamp = new Date().getTime();
      localStorage.setItem('sagan_contacts_timestamp', timestamp.toString());
      setLastUpdated(new Date(timestamp).toLocaleString());
      
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
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      // Special handling for arrays
      if (Array.isArray(aValue) || Array.isArray(bValue)) {
        const aString = Array.isArray(aValue) ? aValue.join(', ') : (aValue || "");
        const bString = Array.isArray(bValue) ? bValue.join(', ') : (bValue || "");
        return direction === "asc" ? aString.localeCompare(bString) : bString.localeCompare(aString);
      }

      // Regular string comparison
      const aString = aValue?.toString() || "";
      const bString = bValue?.toString() || "";
      
      if (direction === "asc") {
        return aString.localeCompare(bString);
      } else {
        return bString.localeCompare(aString);
      }
    });

    setFilteredContacts(filtered);
  };

  // Fetch contacts and custom fields on component mount
  useEffect(() => {
    fetchContacts();
    // We only want to fetch contacts and custom fields on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add a function to safely access contact fields regardless of case
  const getContactValue = (contact: Contact, key: string): string | string[] | undefined => {
    // Try direct access first (lowercase keys as in our interface)
    if (contact[key as keyof Contact] !== undefined) {
      return contact[key as keyof Contact];
    }
    
    // Try uppercase version (as might come from CSV)
    const upperKey = key.toUpperCase();
    if (typeof contact[upperKey as keyof Contact] !== 'undefined') {
      return contact[upperKey as keyof Contact];
    }
    
    // Try case-insensitive search as last resort
    const matchingKey = Object.keys(contact).find(k => k.toLowerCase() === key.toLowerCase());
    if (matchingKey) {
      return contact[matchingKey as keyof Contact];
    }
    
    return undefined;
  };

  // Add selection handling functions
  const toggleContactSelection = (email: string) => {
    const newSelection = new Set(selectedContacts);
    if (newSelection.has(email)) {
      newSelection.delete(email);
    } else {
      newSelection.add(email);
    }
    setSelectedContacts(newSelection);
  };

  const toggleAllSelection = () => {
    if (selectedContacts.size === filteredContacts.length) {
      // Deselect all
      setSelectedContacts(new Set());
    } else {
      // Select all filtered contacts
      const allEmails = filteredContacts.map(contact => contact.email);
      setSelectedContacts(new Set(allEmails));
    }
  };

  const isContactSelected = (email: string) => {
    return selectedContacts.has(email);
  };

  const clearSelection = () => {
    setSelectedContacts(new Set());
  };

  // Reset selection when contacts or filters change
  useEffect(() => {
    clearSelection();
  }, [contacts, searchTerm]);

  // Tag management functions
  const addTagToContact = async (email: string, tag: string) => {
    setIsUpdatingTags(true);
    setTagActionError('');
    setTagActionSuccess('');
    
    try {
      // Get the existing contact
      const contact = contacts.find(c => c.email === email);
      if (!contact) {
        throw new Error(`Contact with email ${email} not found`);
      }
      
      // Get existing tags
      let existingTags: string[] = [];
      if (contact.tags_array) {
        existingTags = [...contact.tags_array];
      } else if (typeof contact.tags === 'string') {
        existingTags = contact.tags.split(',').map(t => t.trim()).filter(Boolean);
      }
      
      // Check if tag already exists
      if (existingTags.includes(tag)) {
        setTagActionSuccess(`Tag "${tag}" already exists for this contact`);
        setIsUpdatingTags(false);
        return;
      }
      
      // Add the new tag
      const newTags = [...existingTags, tag];
      
      // Update the contact
      const response = await fetch('/api/contacts/update-tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emails: [email],
          tags: newTags.join(', ')
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update local contact data
        const updatedContacts = contacts.map(c => {
          if (c.email === email) {
            return {
              ...c,
              tags: newTags.join(', '),
              tags_array: newTags
            };
          }
          return c;
        });
        
        setContacts(updatedContacts);
        applyFiltersAndSort(updatedContacts, searchTerm, sortField, sortDirection);
        setTagActionSuccess(`Added tag "${tag}" to contact`);
        
        // Update localStorage cache
        localStorage.setItem('sagan_contacts', JSON.stringify(updatedContacts));
      } else {
        throw new Error(data.error || 'Failed to update tags');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred updating tags';
      setTagActionError(errorMessage);
      console.error('Error adding tag:', error);
    } finally {
      setIsUpdatingTags(false);
    }
  };

  const executeTagAction = async () => {
    if (selectedContacts.size === 0) {
      setTagActionError('No contacts selected');
      return;
    }
    
    setIsUpdatingTags(true);
    setTagActionError('');
    setTagActionSuccess('');
    
    try {
      const selectedEmails = Array.from(selectedContacts);
      let updatedTags: Record<string, string[]> = {};
      
      // Build updated tags for each contact based on operation
      for (const email of selectedEmails) {
        const contact = contacts.find(c => c.email === email);
        if (!contact) continue;
        
        // Get existing tags
        let existingTags: string[] = [];
        if (contact.tags_array) {
          existingTags = [...contact.tags_array];
        } else if (typeof contact.tags === 'string') {
          existingTags = contact.tags.split(',').map(t => t.trim()).filter(Boolean);
        }
        
        let newTags: string[] = [];
        
        switch (tagOperation) {
          case 'add':
            if (!existingTags.includes(newTagValue)) {
              newTags = [...existingTags, newTagValue];
            } else {
              newTags = existingTags; // No change needed
            }
            break;
            
          case 'remove':
            newTags = existingTags.filter(tag => tag !== oldTagValue);
            break;
            
          case 'replace':
            newTags = existingTags.map(tag => 
              tag === oldTagValue ? newTagValue : tag
            );
            break;
        }
        
        updatedTags[email] = newTags;
      }
      
      // Perform the update
      const response = await fetch('/api/contacts/bulk-update-tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          updates: Object.entries(updatedTags).map(([email, tags]) => ({
            email,
            tags: tags.join(', ')
          }))
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update local contact data
        const updatedContacts = contacts.map(c => {
          if (selectedContacts.has(c.email) && updatedTags[c.email]) {
            return {
              ...c,
              tags: updatedTags[c.email].join(', '),
              tags_array: updatedTags[c.email]
            };
          }
          return c;
        });
        
        setContacts(updatedContacts);
        applyFiltersAndSort(updatedContacts, searchTerm, sortField, sortDirection);
        
        // Update localStorage cache
        localStorage.setItem('sagan_contacts', JSON.stringify(updatedContacts));
        
        // Set success message based on operation
        let successMessage = '';
        switch (tagOperation) {
          case 'add':
            successMessage = `Added tag "${newTagValue}" to ${selectedContacts.size} contact(s)`;
            break;
          case 'remove':
            successMessage = `Removed tag "${oldTagValue}" from ${selectedContacts.size} contact(s)`;
            break;
          case 'replace':
            successMessage = `Replaced tag "${oldTagValue}" with "${newTagValue}" for ${selectedContacts.size} contact(s)`;
            break;
        }
        
        setTagActionSuccess(successMessage);
        setTagModalOpen(false);
        
      } else {
        throw new Error(data.error || 'Failed to update tags');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred updating tags';
      setTagActionError(errorMessage);
      console.error('Error updating tags:', error);
    } finally {
      setIsUpdatingTags(false);
    }
  };

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
                {STANDARD_COLUMNS.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.key}
                    checked={visibleColumns.has(column.key)}
                    onCheckedChange={() => toggleColumn(column.key)}
                    disabled={column.key === "email"} // Can't hide email
                  >
                    {column.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Tag Actions UI - Only show when contacts are selected */}
      {selectedContacts.size > 0 && (
        <div className="mb-4 bg-gray-50 rounded-md p-3 border border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between gap-2 items-start sm:items-center mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{selectedContacts.size} contact{selectedContacts.size !== 1 ? 's' : ''} selected</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearSelection}
                className="text-xs h-7 px-2"
              >
                Clear
              </Button>
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    Tag Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Manage Tags</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    onClick={() => {
                      setTagOperation('add');
                      setNewTagValue('');
                      setTagModalOpen(true);
                    }}
                  >
                    Add tag to selected
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    onClick={() => {
                      setTagOperation('remove');
                      setOldTagValue('');
                      setTagModalOpen(true);
                    }}
                  >
                    Remove tag from selected
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    onClick={() => {
                      setTagOperation('replace');
                      setOldTagValue('');
                      setNewTagValue('');
                      setTagModalOpen(true);
                    }}
                  >
                    Replace tag in selected
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {tagActionSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-md text-sm mb-2">
              {tagActionSuccess}
            </div>
          )}
          
          {tagActionError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm mb-2">
              {tagActionError}
            </div>
          )}
        </div>
      )}

      {/* Tag Action Modal */}
      {tagModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">
              {tagOperation === 'add' && 'Add Tag'}
              {tagOperation === 'remove' && 'Remove Tag'}
              {tagOperation === 'replace' && 'Replace Tag'}
            </h3>
            
            {tagOperation === 'add' && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Tag to add:</label>
                <Input
                  value={newTagValue}
                  onChange={(e) => setNewTagValue(e.target.value)}
                  placeholder="Enter tag name"
                  className="w-full"
                />
              </div>
            )}
            
            {(tagOperation === 'remove' || tagOperation === 'replace') && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Tag to {tagOperation === 'remove' ? 'remove' : 'replace'}:</label>
                <Input
                  value={oldTagValue}
                  onChange={(e) => setOldTagValue(e.target.value)}
                  placeholder="Enter existing tag name"
                  className="w-full"
                />
              </div>
            )}
            
            {tagOperation === 'replace' && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">New tag:</label>
                <Input
                  value={newTagValue}
                  onChange={(e) => setNewTagValue(e.target.value)}
                  placeholder="Enter new tag name"
                  className="w-full"
                />
              </div>
            )}
            
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setTagModalOpen(false)}
                disabled={isUpdatingTags}
              >
                Cancel
              </Button>
              <Button
                onClick={executeTagAction}
                disabled={
                  isUpdatingTags || 
                  (tagOperation === 'add' && !newTagValue) ||
                  (tagOperation === 'remove' && !oldTagValue) ||
                  (tagOperation === 'replace' && (!oldTagValue || !newTagValue))
                }
              >
                {isUpdatingTags ? 'Processing...' : 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin h-8 w-8 border-4 border-gray-300 rounded-full border-t-blue-600"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={filteredContacts.length > 0 && selectedContacts.size === filteredContacts.length}
                    onChange={toggleAllSelection}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </TableHead>
                {STANDARD_COLUMNS.filter(col => visibleColumns.has(col.key)).map(column => (
                  <TableHead
                    key={column.key}
                    className={`cursor-pointer ${sortField === column.key ? "font-bold" : ""}`}
                    onClick={() => handleSortChange(column.key)}
                  >
                    {column.label} {sortField === column.key && (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
                ))}
                <TableHead className="w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.length > 0 ? (
                filteredContacts.map((contact, index) => (
                  <TableRow key={index} className={isContactSelected(contact.email) ? "bg-blue-50" : ""}>
                    <TableCell className="w-12">
                      <input
                        type="checkbox"
                        checked={isContactSelected(contact.email)}
                        onChange={() => toggleContactSelection(contact.email)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </TableCell>
                    {STANDARD_COLUMNS.filter(col => visibleColumns.has(col.key)).map(column => (
                      <TableCell key={column.key}>
                        {column.key === "tags" ? (
                          <div className="flex flex-wrap gap-1">
                            {contact.tags_array ? (
                              // If tags_array exists, use it (our parsed format)
                              (contact.tags_array as string[]).map((tag, i) => (
                                <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs whitespace-nowrap">
                                  {tag}
                                </span>
                              ))
                            ) : getContactValue(contact, 'tags') ? (
                              // Try to get tags with our helper function
                              (typeof getContactValue(contact, 'tags') === 'string' 
                                ? (getContactValue(contact, 'tags') as string).split(',') 
                                : (getContactValue(contact, 'tags') as string[])
                              ).map((tag: string, i: number) => (
                                <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs whitespace-nowrap">
                                  {tag.trim()}
                                </span>
                              ))
                            ) : (
                              <span>-</span>
                            )}
                          </div>
                        ) :
                          // Use our helper function for all other values
                          (() => {
                            const value = getContactValue(contact, column.key as string);
                            if (Array.isArray(value)) {
                              return value.join(', ');
                            }
                            return value || "-";
                          })()
                        }
                      </TableCell>
                    ))}
                    <TableCell className="w-16">
                      <div className="flex items-center justify-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem 
                              onClick={() => {
                                setTagInput('');
                                const addTagPrompt = prompt('Enter a tag to add to this contact:');
                                if (addTagPrompt) {
                                  addTagToContact(contact.email, addTagPrompt.trim());
                                }
                              }}
                            >
                              Add tag
                            </DropdownMenuCheckboxItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={visibleColumns.size + 2} className="text-center py-8">
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