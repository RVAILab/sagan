"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import SegmentForm from "@/components/SegmentForm";
import SegmentList from "@/components/SegmentList";
import { PlusCircle } from "lucide-react";
import { getStoredSegments } from "@/lib/segmentUtils";

// Define segment type to match what's expected
interface Segment {
  id: string;
  name: string;
  query_dsl: string;
  contacts_count: number;
  last_refreshed_at?: string;
  created_at: string;
  updated_at: string;
  tags?: string[];
}

export default function SegmentsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [refreshFlag, setRefreshFlag] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Try to load cached segments from localStorage on initial render
  useEffect(() => {
    // Only attempt to load from localStorage on first render
    try {
      const cachedSegments = getStoredSegments();
      if (cachedSegments.length > 0) {
        // Create basic segment objects from cached data
        const basicSegments = cachedSegments.map((segment: { id: string; name: string }) => ({
          id: segment.id,
          name: segment.name,
          contacts_count: 0,
          created_at: "",
          updated_at: "",
          query_dsl: ""
        }));
        
        setSegments(basicSegments);
        // Still show loading state as we'll update with the full data
      }
    } catch (err) {
      console.error("Failed to load segments from localStorage:", err);
      // Don't set an error as we'll try to fetch from the API anyway
    }
  }, []);

  useEffect(() => {
    async function loadSegments() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/segments");
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || "Failed to load segments");
        }
        
        const segmentsData = data.results || [];
        setSegments(segmentsData);
        
        // Save segments to localStorage (only id and name for reference)
        try {
          const simplifiedSegments = segmentsData.map((segment: Segment) => ({
            id: segment.id,
            name: segment.name
          }));
          localStorage.setItem('sagan_segments', JSON.stringify(simplifiedSegments));
        } catch (storageErr) {
          console.error('Failed to cache segments in localStorage:', storageErr);
        }
      } catch (err) {
        console.error("Failed to load segments:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setIsLoading(false);
      }
    }

    loadSegments();
  }, [refreshFlag]);

  const handleSegmentCreated = () => {
    setShowCreateForm(false);
    setRefreshFlag(prev => prev + 1);
  };

  const handleSegmentDeleted = () => {
    setRefreshFlag(prev => prev + 1);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Audience Segments</h1>
        <Button 
          onClick={() => setShowCreateForm(true)} 
          disabled={showCreateForm}
          className="gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Create Segment</span>
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded-md">
          Error: {error}
        </div>
      )}

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Segment</CardTitle>
          </CardHeader>
          <CardContent>
            <SegmentForm 
              onSegmentCreated={handleSegmentCreated} 
              onCancel={() => setShowCreateForm(false)}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Manage Segments</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <SegmentList 
              segments={segments} 
              onSegmentDeleted={handleSegmentDeleted}
              onRefreshList={() => setRefreshFlag(prev => prev + 1)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
} 