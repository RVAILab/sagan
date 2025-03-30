'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  tags: string[];
  phone: string;
}

interface SubmissionState {
  isSubmitting: boolean;
  isSuccess: boolean;
  isError: boolean;
  message: string;
}

interface DuplicateState {
  checking: boolean;
  isDuplicate: boolean;
  contactDetails: Record<string, unknown> | null;
}

interface PendingJob {
  jobId: string;
  email: string;
  name: string;
  createdAt: number;
  status?: string;
  errorInfo?: {
    erroredCount?: number;
    requestedCount?: number;
    errorDetails?: string;
    errorMessage?: string;
  };
}

// Common source tags that can be quickly added
const COMMON_TAGS = ['meetup', 'passerby', 'partner', 'friend', 'social', 'event', 'website'];

const STORAGE_KEY = 'sagan_pending_jobs';

// Functions to manage pending jobs in localStorage
const getPendingJobs = (): PendingJob[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (err) {
    console.error('Error retrieving pending jobs from localStorage:', err);
    return [];
  }
};

const savePendingJobs = (jobs: PendingJob[]) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
  } catch (err) {
    console.error('Error saving pending jobs to localStorage:', err);
  }
};

const addPendingJob = (job: PendingJob) => {
  const currentJobs = getPendingJobs();
  
  // Add the new job to the beginning of the array
  const updatedJobs = [job, ...currentJobs];
  
  // Keep only the 20 most recent jobs
  const trimmedJobs = updatedJobs.slice(0, 20);
  
  savePendingJobs(trimmedJobs);
  return trimmedJobs;
};

const updatePendingJobStatus = (jobId: string, status: string) => {
  const currentJobs = getPendingJobs();
  const updatedJobs = currentJobs.map(job => 
    job.jobId === jobId ? { ...job, status } : job
  );
  
  savePendingJobs(updatedJobs);
  return updatedJobs;
};

export function ContactForm() {
  const firstNameInputRef = useRef<HTMLInputElement>(null);
  const emailCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [refreshPendingJobs, setRefreshPendingJobs] = useState(0);

  const [formData, setFormData] = useState<FormState>({
    firstName: '',
    lastName: '',
    email: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    tags: [],
    phone: '',
  });

  const [submissionState, setSubmissionState] = useState<SubmissionState>({
    isSubmitting: false,
    isSuccess: false,
    isError: false,
    message: '',
  });
  
  const [duplicateState, setDuplicateState] = useState<DuplicateState>({
    checking: false,
    isDuplicate: false,
    contactDetails: null,
  });
  
  const [showMoreFields, setShowMoreFields] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [contactsAdded, setContactsAdded] = useState(0);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      firstNameInputRef.current?.focus();
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [contactsAdded]);

  // Check for duplicate email
  const checkEmailExists = async (email: string) => {
    if (!email || !validateEmail(email)) return;
    
    console.log('Checking if email exists:', email);
    setDuplicateState(prev => ({ ...prev, checking: true }));
    
    try {
      const response = await fetch('/api/contacts/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      console.log('Email check response:', data);
      
      if (data.success) {
        console.log('Setting duplicate state:', {
          checking: false,
          isDuplicate: data.exists,
          contactDetails: data.contactDetails,
        });
        
        setDuplicateState({
          checking: false,
          isDuplicate: data.exists,
          contactDetails: data.contactDetails,
        });
      } else {
        // Handle error quietly
        console.error('Error checking email:', data.error);
        setDuplicateState({
          checking: false,
          isDuplicate: false,
          contactDetails: null,
        });
      }
    } catch (error) {
      // Handle error quietly
      console.error('Exception checking email:', error);
      setDuplicateState({
        checking: false,
        isDuplicate: false,
        contactDetails: null,
      });
    }
  };

  const debouncedCheckEmail = (email: string) => {
    // Clear existing timeout
    if (emailCheckTimeoutRef.current) {
      clearTimeout(emailCheckTimeoutRef.current);
    }
    
    // Set duplicate state to checking
    if (email && validateEmail(email)) {
      setDuplicateState(prev => ({ ...prev, checking: true }));
    }
    
    // Set new timeout
    emailCheckTimeoutRef.current = setTimeout(() => {
      checkEmailExists(email);
    }, 500); // 500ms debounce delay
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear email validation error when user types
    if (name === 'email') {
      setEmailError('');
      
      // Clear duplicate state when email is empty
      if (!value.trim()) {
        setDuplicateState({
          checking: false,
          isDuplicate: false,
          contactDetails: null,
        });
      } else if (validateEmail(value)) {
        // Check for duplicates if valid email
        debouncedCheckEmail(value);
      }
    }
  };
  
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    
    if (!isValid) {
      setEmailError('Please enter a valid email address');
    }
    
    return isValid;
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      tags: [],
      phone: '',
    });
    setSubmissionState({
      isSubmitting: false,
      isSuccess: false,
      isError: false,
      message: '',
    });
    setDuplicateState({
      checking: false,
      isDuplicate: false,
      contactDetails: null,
    });
    setTagInput('');
    // Keep the current state of showMoreFields
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email before submission
    if (!validateEmail(formData.email)) {
      return;
    }
    
    // If it's a duplicate, confirm before submission
    if (duplicateState.isDuplicate && !confirm('This email already exists in your contacts. Are you sure you want to update it?')) {
      return;
    }
    
    setSubmissionState({
      isSubmitting: true,
      isSuccess: false,
      isError: false,
      message: 'Submitting...',
    });

    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success && data.jobId) {
        // Increment contacts added count
        setContactsAdded(prev => prev + 1);
        
        // Add to pending jobs in localStorage
        const newJob: PendingJob = {
          jobId: data.jobId,
          email: formData.email,
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          createdAt: Date.now()
        };
        
        addPendingJob(newJob);
        setRefreshPendingJobs(prev => prev + 1);
        
        // Show submission received message
        setSubmissionState({
          isSubmitting: false,
          isSuccess: true,
          isError: false,
          message: `Contact submitted for processing! Job ID: ${data.jobId}`,
        });
        
        // Check job status after a short delay
        setTimeout(async () => {
          try {
            const statusResponse = await fetch(`/api/contacts/status?job_id=${data.jobId}`);
            const statusData = await statusResponse.json();
            
            if (statusData.success) {
              console.log('Job status:', statusData.status);
              
              // Update job status in localStorage
              const status = statusData.status.status || 'pending';
              updatePendingJobStatus(data.jobId, status);
              setRefreshPendingJobs(prev => prev + 1);
              
              // Update message with job status
              setSubmissionState(prev => ({
                ...prev,
                message: `Contact ${duplicateState.isDuplicate ? 'updated' : 'added'} successfully! Status: ${status}`
              }));
            }
          } catch (statusError) {
            console.error('Error checking job status:', statusError);
          }
        }, 2000); // Check after 2 seconds
        
        // Reset form fields for next entry
        resetForm();
        
        // Clear success message after 5 seconds (longer to show status)
        setTimeout(() => {
          setSubmissionState(prev => ({
            ...prev,
            isSuccess: false,
          }));
        }, 5000);
      } else {
        throw new Error(data.error || 'Something went wrong');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred. Please try again.';
      setSubmissionState({
        isSubmitting: false,
        isSuccess: false,
        isError: true,
        message: errorMessage,
      });
    }
  };
  
  const addTag = (tag: string) => {
    // Normalize the tag (lowercase, trim)
    const normalizedTag = tag.toLowerCase().trim();
    
    // Skip if tag is empty or already exists
    if (!normalizedTag || formData.tags.includes(normalizedTag)) {
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, normalizedTag]
    }));
    
    // Clear the input field after adding
    setTagInput('');
  };
  
  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };
  
  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Add tag when Enter is pressed
    if (e.key === 'Enter' && tagInput) {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Contact Entry Tool</h2>
        {contactsAdded > 0 && (
          <div className="text-sm text-muted-foreground">
            Contacts added: <span className="font-medium">{contactsAdded}</span>
          </div>
        )}
      </div>

      {submissionState.isSuccess && (
        <div className="text-sm p-2 mb-4 bg-green-50 text-green-700 rounded-md border border-green-200">
          ✓ {submissionState.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium pb-1">
              First Name <span className="text-red-500">*</span>
            </label>
            <Input
              ref={firstNameInputRef}
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              placeholder="First Name"
              className="h-11 text-base"
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium pb-1">
              Last Name
            </label>
            <Input
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Last Name"
              className="h-11 text-base"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium pb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="email@example.com"
              className={`h-11 text-base ${emailError ? 'border-red-500 focus-visible:ring-red-500/30 focus-visible:border-red-500' : ''} ${duplicateState.isDuplicate ? 'border-amber-500 focus-visible:ring-amber-500/30 focus-visible:border-amber-500' : ''}`}
            />
            {duplicateState.checking && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                Checking...
              </div>
            )}
          </div>
          {emailError && (
            <p className="text-red-500 text-xs mt-1">{emailError}</p>
          )}
          {duplicateState.isDuplicate && !emailError && (
            <div className="mt-1 p-2 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-700">
              <p className="font-medium">This email already exists in your contacts!</p>
              {duplicateState.contactDetails && (
                <p className="mt-1">
                  Existing contact: {(duplicateState.contactDetails.first_name as string) || ''} {(duplicateState.contactDetails.last_name as string) || ''}
                </p>
              )}
              <p className="mt-1">Continuing will update the existing contact.</p>
            </div>
          )}
        </div>
        
        <div className="bg-gray-50 p-3 rounded-md border border-gray-100">
          <label htmlFor="tags" className="block text-sm font-medium pb-1">
            Tags <span className="text-sm font-normal text-muted-foreground">(How did they hear about us?)</span>
          </label>
          
          <div className="flex flex-wrap gap-2 mb-2 min-h-[28px]">
            {formData.tags.map(tag => (
              <div 
                key={tag} 
                className="flex items-center bg-white text-primary rounded-full px-2 py-1 text-xs border border-gray-200"
              >
                {tag}
                <button 
                  type="button" 
                  onClick={() => removeTag(tag)} 
                  className="ml-1 text-primary/70 hover:text-primary"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2">
            <Input
              id="tagInput"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInputKeyDown}
              placeholder="Add custom tag..."
              className="text-sm bg-white"
            />
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => addTag(tagInput)}
              disabled={!tagInput.trim()}
              className="bg-white"
            >
              Add
            </Button>
          </div>
          
          <div className="mt-2">
            <p className="text-xs text-muted-foreground mb-1">Quick add:</p>
            <div className="flex flex-wrap gap-1">
              {COMMON_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => addTag(tag)}
                  disabled={formData.tags.includes(tag)}
                  className={`text-xs px-2 py-1 rounded-full border ${
                    formData.tags.includes(tag) 
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                      : 'bg-white hover:bg-primary/10 hover:text-primary border-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => setShowMoreFields(!showMoreFields)}
            className="text-xs text-primary underline-offset-4 hover:underline"
          >
            {showMoreFields ? '- Hide address fields' : '+ Add address fields'}
          </button>
          
          <Button
            type="submit"
            className="px-4 h-9"
            disabled={submissionState.isSubmitting}
          >
            {submissionState.isSubmitting ? 'Adding...' : 'Add Contact'}
          </Button>
        </div>
        
        {showMoreFields && (
          <div className="space-y-4 pt-2 border-t">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium pb-1">
                Phone Number
              </label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone Number"
              />
            </div>
            
            <div>
              <label htmlFor="city" className="block text-sm font-medium pb-1">
                City
              </label>
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="City"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="state" className="block text-sm font-medium pb-1">
                  State/Province
                </label>
                <Input
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="State/Province"
                />
              </div>
              <div>
                <label htmlFor="postalCode" className="block text-sm font-medium pb-1">
                  Postal Code
                </label>
                <Input
                  id="postalCode"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  placeholder="Postal Code"
                />
              </div>
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-medium pb-1">
                Country
              </label>
              <Input
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="Country"
              />
            </div>
          </div>
        )}

        {submissionState.isError && (
          <div className="text-center p-3 bg-red-50 text-red-700 rounded-md text-sm">
            <p>{submissionState.message}</p>
          </div>
        )}
      </form>
      
      {contactsAdded > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <p className="text-xs text-muted-foreground">
            Keyboard shortcut: <span className="font-mono bg-gray-100 px-1 rounded text-xs">Tab</span> through fields, then <span className="font-mono bg-gray-100 px-1 rounded text-xs">Enter</span> to submit
          </p>
        </div>
      )}
      
      {/* Key based on refreshPendingJobs to trigger re-render when needed */}
      <PendingJobsList 
        key={refreshPendingJobs} 
        onRefresh={() => setRefreshPendingJobs(prev => prev + 1)} 
      />
    </Card>
  );
}

function PendingJobsList({ onRefresh }: { onRefresh: () => void }) {
  const [jobs, setJobs] = useState<PendingJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    setJobs(getPendingJobs());
  }, []);
  
  const checkJobStatus = async (jobId: string) => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/contacts/status?job_id=${jobId}`);
      const data = await response.json();
      
      if (data.success) {
        console.log('Job status:', data.status);
        const status = data.status.status || 'pending';
        
        // Update job with status and any error information
        const updatedJobs = getPendingJobs().map(job => 
          job.jobId === jobId 
            ? { 
                ...job, 
                status, 
                errorInfo: data.errorInfo 
              } 
            : job
        );
        
        savePendingJobs(updatedJobs);
        setJobs(updatedJobs);
      }
    } catch (error) {
      console.error('Error checking job status:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const checkAllJobStatuses = async () => {
    setIsLoading(true);
    
    const pendingJobs = jobs.filter(job => !job.status || job.status === 'pending');
    
    for (const job of pendingJobs) {
      await checkJobStatus(job.jobId);
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    onRefresh();
    setIsLoading(false);
  };
  
  // Only show if there are pending jobs (no status or status is pending)
  const pendingJobsExist = jobs.some(job => !job.status || job.status === 'pending');
  
  if (!pendingJobsExist) return null;
  
  return (
    <div className="mt-6 pt-4 border-t border-gray-100">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium">Pending Contact Submissions</h3>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={checkAllJobStatuses}
          disabled={isLoading}
          className="text-xs h-7 px-2"
        >
          {isLoading ? 'Checking...' : 'Check All Statuses'}
        </Button>
      </div>
      
      <div className="space-y-2 max-h-[200px] overflow-y-auto">
        {jobs.filter(job => !job.status || job.status === 'pending').map(job => (
          <div 
            key={job.jobId} 
            className={`border rounded-md p-2 text-xs flex justify-between items-center ${
              job.errorInfo ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div>
              <div className="font-medium">{job.name || 'Contact'}</div>
              <div className="text-muted-foreground">{job.email}</div>
              <div className={`${job.errorInfo ? 'text-red-600' : 'text-muted-foreground'}`}>
                Submitted: {new Date(job.createdAt).toLocaleTimeString()} 
                {job.status ? ` • Status: ${job.status}` : ' • Pending'}
                {job.errorInfo && job.errorInfo.erroredCount ? 
                  ` • Errors: ${job.errorInfo.erroredCount}/${job.errorInfo.requestedCount}` 
                  : ''}
              </div>
              {job.errorInfo && job.errorInfo.errorMessage && (
                <div className="mt-1 text-red-600">
                  <span className="font-medium">Error:</span> {job.errorInfo.errorMessage}
                </div>
              )}
            </div>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => checkJobStatus(job.jobId)}
              disabled={isLoading}
              className="text-xs h-7"
            >
              Check
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
} 