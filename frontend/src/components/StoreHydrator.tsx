'use client';

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { hydrate } from '../store/slices/authSlice';

export function StoreHydrator({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();

  useEffect(() => {
    // Hydrate the store with localStorage data
    dispatch(hydrate());
  }, [dispatch]);

  return <>{children}</>;
}
