'use client';

import { initializeTheme } from '@/store/slices/themeSlice';
import type { RootState } from '@/store/store';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const dispatch = useDispatch();
  const { theme } = useSelector((state: RootState) => state.theme);

  useEffect(() => {
    // Initialize theme on mount
    dispatch(initializeTheme());
  }, [dispatch]);

  useEffect(() => {
    // Update document class when theme changes
    if (typeof window !== 'undefined') {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(theme);
    }
  }, [theme]);

  return <>{children}</>;
}
