/**
 * Utility functions for managing segments in localStorage
 */

export interface StoredSegment {
  id: string;
  name: string;
}

/**
 * Get all segments from localStorage
 */
export function getStoredSegments(): StoredSegment[] {
  try {
    const segments = localStorage.getItem('sagan_segments');
    return segments ? JSON.parse(segments) : [];
  } catch (err) {
    console.error('Failed to get segments from localStorage:', err);
    return [];
  }
}

/**
 * Add or update a segment in localStorage
 */
export function upsertStoredSegment(segment: StoredSegment): void {
  try {
    const segments = getStoredSegments();
    const index = segments.findIndex(s => s.id === segment.id);
    
    if (index >= 0) {
      segments[index] = segment;
    } else {
      segments.push(segment);
    }
    
    localStorage.setItem('sagan_segments', JSON.stringify(segments));
  } catch (err) {
    console.error('Failed to update segment in localStorage:', err);
  }
}

/**
 * Remove a segment from localStorage
 */
export function removeStoredSegment(segmentId: string): void {
  try {
    const segments = getStoredSegments();
    const filteredSegments = segments.filter(s => s.id !== segmentId);
    localStorage.setItem('sagan_segments', JSON.stringify(filteredSegments));
  } catch (err) {
    console.error('Failed to remove segment from localStorage:', err);
  }
}

/**
 * Get a segment by ID from localStorage
 */
export function getStoredSegmentById(segmentId: string): StoredSegment | undefined {
  try {
    const segments = getStoredSegments();
    return segments.find(s => s.id === segmentId);
  } catch (err) {
    console.error('Failed to get segment from localStorage:', err);
    return undefined;
  }
}

/**
 * Check if segments exist in localStorage
 */
export function hasStoredSegments(): boolean {
  try {
    const segments = getStoredSegments();
    return segments.length > 0;
  } catch (err) {
    console.error('Failed to check segments in localStorage:', err);
    return false;
  }
} 