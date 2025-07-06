'use client';

import Clarity from '@microsoft/clarity';
import { useEffect } from 'react';

interface ClarityProps {
  projectId?: string;
}

export default function ClarityProvider({ projectId }: ClarityProps) {
  useEffect(() => {
    // Only initialize Clarity if we have a project ID and are in the browser
    if (typeof window !== 'undefined' && projectId) {
      try {
        Clarity.init(projectId);
        console.log('Microsoft Clarity initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Microsoft Clarity:', error);
      }
    }
  }, [projectId]);

  // This component doesn't render anything
  return null;
}

// Export utility functions for using Clarity throughout the app
export const clarityUtils = {
  // Identify a user with custom identifiers
  identify: (
    customId: string,
    customSessionId?: string,
    customPageId?: string,
    friendlyName?: string
  ) => {
    if (typeof window !== 'undefined') {
      Clarity.identify(customId, customSessionId, customPageId, friendlyName);
    }
  },

  // Set custom tags
  setTag: (key: string, value: string | string[]) => {
    if (typeof window !== 'undefined') {
      Clarity.setTag(key, value);
    }
  },

  // Track custom events
  event: (eventName: string) => {
    if (typeof window !== 'undefined') {
      Clarity.event(eventName);
    }
  },

  // Handle cookie consent
  consent: (hasConsent = true) => {
    if (typeof window !== 'undefined') {
      Clarity.consent(hasConsent);
    }
  },

  // Upgrade session for priority recording
  upgrade: (reason: string) => {
    if (typeof window !== 'undefined') {
      Clarity.upgrade(reason);
    }
  },
};
