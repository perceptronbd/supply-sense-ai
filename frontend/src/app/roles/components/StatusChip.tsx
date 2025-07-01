'use client';

import { Chip } from '@heroui/react';

interface StatusChipProps {
  isActive: boolean;
}

export function StatusChip({ isActive }: StatusChipProps) {
  return (
    <Chip size="sm" variant="flat" color={isActive ? 'success' : 'default'}>
      {isActive ? 'Active' : 'Inactive'}
    </Chip>
  );
}
