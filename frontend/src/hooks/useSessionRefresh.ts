import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';

/**
 * Custom hook to handle session list refresh when triggered by Redux state
 * Simplifies the session refresh logic by using Redux instead of callback refs
 */
export function useSessionRefresh(refetchFn: () => void) {
  const sessionRefreshTrigger = useSelector((state: RootState) => state.chat.sessionRefreshTrigger);

  useEffect(() => {
    // Skip the initial render (when trigger is 0)
    if (sessionRefreshTrigger > 0) {
      console.log('Refreshing session list due to trigger:', sessionRefreshTrigger);
      refetchFn();
    }
  }, [sessionRefreshTrigger, refetchFn]);
}
