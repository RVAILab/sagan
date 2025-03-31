"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Edit, MoreVertical, RefreshCw, Trash2 } from "lucide-react";
import SegmentForm from "./SegmentForm";
import { removeStoredSegment } from "@/lib/segmentUtils";

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

interface SegmentListProps {
  segments: Segment[];
  onSegmentDeleted: () => void;
  onRefreshList: () => void;
}

export default function SegmentList({ segments, onSegmentDeleted, onRefreshList }: SegmentListProps) {
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null);
  const [refreshingSegmentId, setRefreshingSegmentId] = useState<string | null>(null);
  const [deletingSegmentId, setDeletingSegmentId] = useState<string | null>(null);
  const [loadingSegmentId, setLoadingSegmentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleEdit = async (segment: Segment) => {
    setLoadingSegmentId(segment.id);
    setError(null);
    
    try {
      const response = await fetch(`/api/segments/${segment.id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch segment details");
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch segment details");
      }
      
      setEditingSegment(data.segment);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred while fetching segment details");
      console.error("Error fetching segment details:", err);
      setEditingSegment(segment);
    } finally {
      setLoadingSegmentId(null);
    }
  };

  const handleUpdate = () => {
    setEditingSegment(null);
    onRefreshList();
  };

  const handleRefresh = async (segmentId: string) => {
    setRefreshingSegmentId(segmentId);
    setError(null);
    
    try {
      const response = await fetch(`/api/segments/${segmentId}/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to refresh segment");
      }
      
      onRefreshList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred while refreshing segment");
    } finally {
      setRefreshingSegmentId(null);
    }
  };

  const handleDelete = async (segmentId: string) => {
    if (!confirm("Are you sure you want to delete this segment? This action cannot be undone.")) {
      return;
    }
    
    setDeletingSegmentId(segmentId);
    setError(null);
    
    try {
      const response = await fetch(`/api/segments/${segmentId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete segment");
      }
      
      removeStoredSegment(segmentId);
      
      onSegmentDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred while deleting segment");
    } finally {
      setDeletingSegmentId(null);
    }
  };

  if (editingSegment) {
    return (
      <Card className="p-4">
        <div className="mb-4">
          <h3 className="text-lg font-medium">Edit Segment</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setEditingSegment(null)}
            className="mt-1"
          >
            Cancel
          </Button>
        </div>
        <SegmentForm 
          segment={{
            id: editingSegment.id,
            name: editingSegment.name,
            tags: editingSegment.tags || []
          }}
          onSegmentUpdated={handleUpdate}
          isEdit={true}
        />
      </Card>
    );
  }

  if (segments.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No segments found. Create your first segment to get started.</div>;
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm mb-4">
          {error}
        </div>
      )}
      
      <div className="grid gap-4">
        {segments.map((segment) => (
          <div key={segment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
            <div className="flex-1">
              <h3 className="font-medium">{segment.name}</h3>
              <div className="mt-1 text-xs text-gray-500 space-y-1">
                <p>Contacts: {segment.contacts_count || 0}</p>
                {segment.last_refreshed_at && (
                  <p>Last refreshed: {new Date(segment.last_refreshed_at).toLocaleString()}</p>
                )}
                {segment.tags && segment.tags.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs text-gray-500 mr-2">Tags:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {segment.tags.map((tag, i) => (
                        <span 
                          key={i} 
                          className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs whitespace-nowrap"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRefresh(segment.id)}
                disabled={refreshingSegmentId === segment.id}
              >
                <RefreshCw className={`h-4 w-4 ${refreshingSegmentId === segment.id ? 'animate-spin' : ''}`} />
                <span className="sr-only">Refresh</span>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={() => handleEdit(segment)}
                    disabled={loadingSegmentId === segment.id}
                  >
                    {loadingSegmentId === segment.id ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleDelete(segment.id)}
                    className="text-red-600 focus:text-red-600"
                    disabled={deletingSegmentId === segment.id}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 