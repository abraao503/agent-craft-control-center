import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { HighlightService } from '@/lib/highlight';

export function PageViewTracker() {
  const location = useLocation();
  const [previousPath, setPreviousPath] = useState<string | null>(null);

  useEffect(() => {
    // Track page view when location changes
    const currentPath = location.pathname;
    
    // Don't track if it's the first load (previousPath is null)
    if (previousPath !== null) {
      HighlightService.trackEvent('page_view', {
        path: currentPath,
        previousPath,
        title: document.title,
        timestamp: new Date().toISOString(),
        search: location.search || '',
        hash: location.hash || '',
      });
    }
    
    // Update previous path for next navigation
    setPreviousPath(currentPath);
  }, [location, previousPath]);

  // This component doesn't render anything visible
  return null;
} 