'use client';

import { useGetItemQuery } from '../../store/api/itemApi';
import { Text } from './Text';

interface ItemDisplayProps {
  itemId: string;
  fallback?: string;
  showSku?: boolean;
  showName?: boolean;
  separator?: string;
  variant?: 'bodySmall' | 'bodyMedium' | 'bodyLarge';
  color?:
    | 'default'
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'muted'
    | 'inverse';
  weight?: 'normal' | 'medium' | 'semiBold';
}

export function ItemDisplay({
  itemId,
  fallback = 'Unknown Item',
  showSku = true,
  showName = true,
  separator = ' - ',
  variant = 'bodyMedium',
  color = 'default',
  weight = 'medium',
}: ItemDisplayProps) {
  const { data: item, isLoading, error } = useGetItemQuery({ id: itemId });

  if (isLoading) {
    return (
      <Text variant={variant} color="muted" weight="normal">
        Loading...
      </Text>
    );
  }

  if (error || !item) {
    return (
      <Text variant={variant} color="muted" weight="normal">
        {fallback}
      </Text>
    );
  }

  const parts = [];
  if (showSku && item.sku) {
    parts.push(item.sku);
  }
  if (showName && item.name) {
    parts.push(item.name);
  }

  const displayText = parts.length > 0 ? parts.join(separator) : fallback;

  return (
    <Text variant={variant} color={color} weight={weight}>
      {displayText}
    </Text>
  );
}
