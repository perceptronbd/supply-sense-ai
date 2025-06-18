import { Text } from '@/components/ui/Text';
import type { Item } from '@/store/api/itemApi';

interface StockDisplayProps {
  stock?: Item['stock'];
}

export function StockDisplay({ stock }: StockDisplayProps) {
  if (!stock) {
    return (
      <Text variant="bodySmall" color="muted">
        —
      </Text>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <Text variant="bodySmall" weight="medium">
        Qty: {stock.quantity ?? '—'}
      </Text>
      <Text variant="bodyXSmall" color="muted">
        Available: {stock.availableQty ?? '—'}
      </Text>
      {stock.reservedQty && stock.reservedQty > 0 && (
        <Text variant="bodyXSmall" color="warning">
          Reserved: {stock.reservedQty}
        </Text>
      )}
    </div>
  );
}
