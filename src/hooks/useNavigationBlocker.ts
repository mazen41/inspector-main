import { useCallback, useEffect, useRef } from 'react';
import { useNavigate, useBeforeUnload } from 'react-router-dom';

interface NavigationBlockerOptions {
  when: boolean;
  message?: string;
}

/**
 * Custom hook to block navigation when there are unsaved changes
 * Works with BrowserRouter by intercepting navigation events
 */
export const useNavigationBlocker = ({ when, message = 'You have unsaved changes. Are you sure you want to leave?' }: NavigationBlockerOptions) => {
  const navigate = useNavigate();
  const isBlockingRef = useRef(false);
  const pendingNavigationRef = useRef<(() => void) | null>(null);

  // Block browser navigation (refresh, back button, etc.)
  useBeforeUnload(
    useCallback(() => {
      if (when) {
        // This will trigger the browser's default "Are you sure?" dialog
        return message;
      }
    }, [when, message])
  );

  // Override the global navigation for Link and NavLink components
  useEffect(() => {
    if (!when) return;

    // Store original pushState and replaceState
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    // Override pushState to intercept programmatic navigation
    window.history.pushState = function(state: any, title: string, url?: string | URL | null) {
      if (isBlockingRef.current) {
        // Already handling a navigation, allow it to proceed
        return originalPushState.call(this, state, title, url);
      }

      if (when && url && url !== window.location.pathname + window.location.search) {
        isBlockingRef.current = true;
        
        if (window.confirm(message)) {
          // User confirmed, proceed with navigation
          isBlockingRef.current = false;
          return originalPushState.call(this, state, title, url);
        } else {
          // User cancelled, don't navigate
          isBlockingRef.current = false;
          return;
        }
      }
      
      return originalPushState.call(this, state, title, url);
    };

    // Override replaceState similarly
    window.history.replaceState = function(state: any, title: string, url?: string | URL | null) {
      if (isBlockingRef.current) {
        return originalReplaceState.call(this, state, title, url);
      }

      if (when && url && url !== window.location.pathname + window.location.search) {
        isBlockingRef.current = true;
        
        if (window.confirm(message)) {
          isBlockingRef.current = false;
          return originalReplaceState.call(this, state, title, url);
        } else {
          isBlockingRef.current = false;
          return;
        }
      }
      
      return originalReplaceState.call(this, state, title, url);
    };

    // Handle popstate events (back/forward buttons)
    const handlePopState = (_event: PopStateEvent) => {
      if (when && !isBlockingRef.current) {
        isBlockingRef.current = true;
        
        if (!window.confirm(message)) {
          // User cancelled, push the current state back
          isBlockingRef.current = false;
          window.history.pushState(null, '', window.location.href);
          return;
        }
        
        isBlockingRef.current = false;
      }
    };

    window.addEventListener('popstate', handlePopState);

    // Cleanup
    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener('popstate', handlePopState);
    };
  }, [when, message]);

  // For programmatic navigation, we'll use a confirmation dialog
  const confirmNavigation = useCallback((callback: () => void) => {
    if (when && !isBlockingRef.current) {
      if (window.confirm(message)) {
        isBlockingRef.current = true;
        callback();
        // Reset after a short delay to allow navigation to complete
        setTimeout(() => {
          isBlockingRef.current = false;
        }, 100);
      }
    } else {
      callback();
    }
  }, [when, message]);

  // Return a wrapped navigate function that shows confirmation
  const blockedNavigate = useCallback((to: string | number, options?: any) => {
    if (typeof to === 'number') {
      // Handle navigate(-1), navigate(1), etc.
      confirmNavigation(() => {
        isBlockingRef.current = true;
        navigate(to);
        setTimeout(() => {
          isBlockingRef.current = false;
        }, 100);
      });
    } else {
      // Handle navigate('/path')
      confirmNavigation(() => {
        isBlockingRef.current = true;
        navigate(to, options);
        setTimeout(() => {
          isBlockingRef.current = false;
        }, 100);
      });
    }
  }, [navigate, confirmNavigation]);

  return {
    navigate: blockedNavigate,
    confirmNavigation,
    isBlocked: when,
    // Mock blocker object for compatibility
    blocker: {
      state: when ? 'blocked' : 'unblocked',
      proceed: () => {
        if (pendingNavigationRef.current) {
          pendingNavigationRef.current();
          pendingNavigationRef.current = null;
        }
      },
      reset: () => {
        pendingNavigationRef.current = null;
      },
      location: undefined
    }
  };
};

export default useNavigationBlocker;