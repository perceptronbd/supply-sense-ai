import { Chip } from '@heroui/react';

interface StatusChipProps {
  isActive: boolean;
}

export function StatusChip({ isActive }: StatusChipProps) {
  return (
    <Chip color={isActive ? 'success' : 'default'} variant="flat" size="sm">
      {isActive ? 'Active' : 'Inactive'}
    </Chip>
  );
}
