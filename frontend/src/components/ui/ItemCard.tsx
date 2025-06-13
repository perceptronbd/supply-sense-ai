'use client';

import { Button } from '@heroui/react';
import { ItemDisplay } from './ItemDisplay';
import { Text } from './Text';

interface ItemCardProps {
  item: {
    itemId: string;
    orderedQty?: number;
    requestedQty?: number;
    unitPrice?: number;
    estimatedPrice?: number;
    deliveryDate?: string;
    requiredDate?: string;
    remarks?: string;
  };
  index: number;
  type: 'purchase-order' | 'purchase-request';
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
}

export function ItemCard({ item, index, type, onEdit, onRemove }: ItemCardProps) {
  const isPurchaseOrder = type === 'purchase-order';
  return (
    <article
      key={`${item.itemId}-${index}`}
      className="border border-divider rounded-lg p-4 bg-content2"
    >
      <section className="flex justify-between items-start">
        <dl className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
          <section>
            <dt>
              <Text variant="bodySmall" color="muted">
                Item
              </Text>
            </dt>
            <dd>
              <ItemDisplay itemId={item.itemId} variant="bodyMedium" />
            </dd>
          </section>
          <section>
            <dt>
              <Text variant="bodySmall" color="muted">
                Quantity
              </Text>
            </dt>
            <dd>
              <Text variant="bodyMedium" weight="medium">
                {isPurchaseOrder ? item.orderedQty : item.requestedQty}
              </Text>
            </dd>
          </section>
          <section>
            <dt>
              <Text variant="bodySmall" color="muted">
                {isPurchaseOrder ? 'Unit Price' : 'Est. Price'}
              </Text>
            </dt>
            <dd>
              <Text variant="bodyMedium" weight="medium">
                {isPurchaseOrder
                  ? `$${Number(item.unitPrice).toFixed(2)}`
                  : item.estimatedPrice
                    ? `$${Number(item.estimatedPrice).toFixed(2)}`
                    : 'N/A'}
              </Text>
            </dd>
          </section>
          <section>
            <dt>
              <Text variant="bodySmall" color="muted">
                {isPurchaseOrder ? 'Delivery Date' : 'Required Date'}
              </Text>
            </dt>
            <dd>
              <Text variant="bodyMedium" weight="medium">
                {isPurchaseOrder
                  ? item.deliveryDate
                    ? new Date(item.deliveryDate).toLocaleDateString()
                    : 'N/A'
                  : item.requiredDate || 'N/A'}
              </Text>
            </dd>
          </section>
          {item.remarks && (
            <section className="md:col-span-4">
              <dt>
                <Text variant="bodySmall" color="muted">
                  Remarks
                </Text>
              </dt>
              <dd>
                <Text variant="bodyMedium" weight="medium">
                  {item.remarks}
                </Text>
              </dd>
            </section>
          )}
        </dl>
        <aside className="flex gap-2 ml-4" role="toolbar" aria-label="Item actions">
          <Button
            type="button"
            size="sm"
            variant="flat"
            color="primary"
            onPress={() => onEdit(index)}
          >
            Edit
          </Button>
          <Button
            type="button"
            size="sm"
            variant="flat"
            color="danger"
            onPress={() => onRemove(index)}
          >
            Remove
          </Button>
        </aside>
      </section>
    </article>
  );
}
