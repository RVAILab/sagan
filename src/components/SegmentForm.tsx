"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { upsertStoredSegment } from "@/lib/segmentUtils";

interface SegmentFormProps {
  segment?: {
    id: string;
    name: string;
    tags: string[];
  };
  onSegmentCreated?: () => void;
  onSegmentUpdated?: () => void;
  onCancel?: () => void;
  isEdit?: boolean;
}

export default function SegmentForm({
  segment,
  onSegmentCreated,
  onSegmentUpdated,
  onCancel,
  isEdit = false,
}: SegmentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: segment?.name || "",
    tags: segment?.tags || [],
  });
  const [error, setError] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load all available tags from localStorage contacts
  useEffect(() => {
    setIsLoading(true);
    try {
      const cachedData = localStorage.getItem('sagan_contacts');
      if (cachedData) {
        const contacts = JSON.parse(cachedData);
        
        // Extract all unique tags from contacts
        const allTags = new Set<string>();
        
        contacts.forEach((contact: { tags_array?: string[]; tags?: string }) => {
          // Handle both string and array format for tags
          if (contact.tags_array && Array.isArray(contact.tags_array)) {
            contact.tags_array.forEach((tag: string) => allTags.add(tag));
          } else if (contact.tags && typeof contact.tags === 'string') {
            contact.tags.split(',').forEach((tag: string) => allTags.add(tag.trim()));
          }
        });
        
        setAvailableTags(Array.from(allTags).sort());
      }
    } catch (err) {
      console.error('Error loading tags from localStorage:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTagToggle = (tag: string) => {
    setFormData((prev) => {
      const isSelected = prev.tags.includes(tag);
      return {
        ...prev,
        tags: isSelected
          ? prev.tags.filter((t) => t !== tag)
          : [...prev.tags, tag],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.tags.length === 0) {
      setError("Please select at least one tag for the segment");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);

    try {
      // Build SQL query for SendGrid based on selected tags
      // Using the correct format we learned from the existing segment
      let tagsCondition;
      
      if (formData.tags.length === 1) {
        // Single tag - use LIKE with escaped double quotes
        tagsCondition = `tags like '%\\"${formData.tags[0]}\\"%'`;
      } else {
        // Multiple tags - use OR condition with multiple LIKE clauses
        tagsCondition = formData.tags
          .map(tag => `tags like '%\\"${tag}\\"%'`)
          .join(' OR ');
      }
      
      const query_dsl = `select contact_id, updated_at from contact_data where ${tagsCondition}`;
      
      const url = isEdit 
        ? `/api/segments/${segment?.id}` 
        : "/api/segments";
      
      const method = isEdit ? "PATCH" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          query_dsl,
          tags: formData.tags, // Send the tags array for our own reference
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save segment");
      }

      const result = await response.json();
      
      // For new segment, get ID from response and update localStorage
      if (!isEdit && result.segment_id) {
        upsertStoredSegment({
          id: result.segment_id,
          name: formData.name
        });
      }
      
      // For edit, update localStorage with current values
      if (isEdit && segment?.id) {
        upsertStoredSegment({
          id: segment.id,
          name: formData.name
        });
      }

      if (isEdit && onSegmentUpdated) {
        onSegmentUpdated();
      } else if (onSegmentCreated) {
        onSegmentCreated();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Segment Name
        </label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="Enter segment name"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Select Tags for Segment
        </label>
        {isLoading ? (
          <div className="py-4 text-center text-gray-500">Loading available tags...</div>
        ) : availableTags.length === 0 ? (
          <div className="py-4 text-center text-gray-500">
            No tags found in your contacts. Add tags to your contacts first.
          </div>
        ) : (
          <ScrollArea className="h-64 rounded-md border">
            <div className="p-4 space-y-2">
              {availableTags.map((tag) => (
                <div key={tag} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`tag-${tag}`}
                    checked={formData.tags.includes(tag)}
                    onCheckedChange={() => handleTagToggle(tag)}
                  />
                  <label
                    htmlFor={`tag-${tag}`}
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {tag}
                  </label>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Select one or more tags to include contacts with those tags in your segment.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button 
          type="submit" 
          disabled={isSubmitting || availableTags.length === 0}
        >
          {isSubmitting ? "Saving..." : isEdit ? "Update Segment" : "Create Segment"}
        </Button>
      </div>
    </form>
  );
} 