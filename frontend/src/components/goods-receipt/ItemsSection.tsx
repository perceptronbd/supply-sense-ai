import { PlusIcon } from '@/components/icons';
import { Text } from '@/components/ui/Text';
import { type GRItemFormData } from '@/lib/schemas/goods-receipt.schema';
import { Button, Card, CardBody, CardHeader } from '@heroui/react';
import { GoodsReceiptItemForm } from './GoodsReceiptItemForm';

interface ItemsSectionProps {
  items: GRItemFormData[];
  showItemForm: boolean;
  setShowItemForm: (show: boolean) => void;
  editingItemIndex: number | null;
  onAddItem: (item: GRItemFormData) => void;
  onEditItem: (index: number, item: GRItemFormData) => void;
  onRemoveItem: (index: number) => void;
  errors: Record<string, string[]>;
  wasSubmitted: boolean;
  calculateTotalAmount: () => number;
}

export function ItemsSection({
  items,
  showItemForm,
  setShowItemForm,
  editingItemIndex,
  onAddItem,
  onEditItem,
  onRemoveItem,
  errors,
  // wasSubmitted, // TODO: Implement validation feedback
  calculateTotalAmount,
}: ItemsSectionProps) {
  const handleEditClick = (_index: number) => {
    // This would set up edit mode - simplified for now
    setShowItemForm(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center w-full">
          <Text variant="titleLarge" weight="semiBold" as="h2">
            Items
          </Text>
          <Button
            color="primary"
            variant="flat"
            size="sm"
            startContent={<PlusIcon />}
            onPress={() => setShowItemForm(true)}
          >
            Add Item
          </Button>
        </div>
      </CardHeader>
      <CardBody>
        {errors.items && (
          <div className="mb-4 text-danger text-sm">
            {errors.items.map((error) => (
              <Text variant="bodySmall" key={error} as="p">
                {error}
              </Text>
            ))}
          </div>
        )}

        {items.length === 0 ? (
          <div className="text-center py-8 text-default-500">
            <Text variant="bodyBase" as="p">
              No items added yet. Click "Add Item" to get started.
            </Text>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item, index) => (
              <Card key={`item-${item.itemId}-${index}`} className="border border-default-200">
                <CardBody>
                  <div className="flex justify-between items-start">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <Text variant="bodySmall" className="text-default-500" as="p">
                          Item ID
                        </Text>
                        <Text variant="bodyBase" as="p">
                          {item.itemId}
                        </Text>
                      </div>
                      <div>
                        <Text variant="bodySmall" className="text-default-500" as="p">
                          Ordered Qty
                        </Text>
                        <Text variant="bodyBase" as="p">
                          {item.orderedQty}
                        </Text>
                      </div>
                      <div>
                        <Text variant="bodySmall" className="text-default-500" as="p">
                          Received Qty
                        </Text>
                        <Text variant="bodyBase" as="p">
                          {item.receivedQty}
                        </Text>
                      </div>
                      <div>
                        <Text variant="bodySmall" className="text-default-500" as="p">
                          Unit Price
                        </Text>
                        <Text variant="bodyBase" as="p">
                          ${item.unitPrice?.toFixed(2) || '0.00'}
                        </Text>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button size="sm" variant="light" onPress={() => handleEditClick(index)}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="light"
                        color="danger"
                        onPress={() => onRemoveItem(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                  {item.qualityNotes && (
                    <div className="mt-3 pt-3 border-t border-default-200">
                      <Text variant="bodySmall" className="text-default-500" as="p">
                        Quality Notes
                      </Text>
                      <Text variant="bodyBase" as="p">
                        {item.qualityNotes}
                      </Text>
                    </div>
                  )}
                </CardBody>
              </Card>
            ))}

            {/* Total Amount */}
            <div className="pt-4 border-t border-default-200">
              <div className="flex justify-end">
                <div className="text-right">
                  <Text variant="titleMedium" weight="semiBold" as="p">
                    Total Amount: ${calculateTotalAmount().toFixed(2)}
                  </Text>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Item Form Modal/Section */}
        {showItemForm && (
          <div className="mt-6">
            <GoodsReceiptItemForm
              onSave={onAddItem}
              onCancel={() => setShowItemForm(false)}
              editingItem={editingItemIndex !== null ? items[editingItemIndex] : undefined}
              onEdit={
                editingItemIndex !== null
                  ? (item: GRItemFormData) => onEditItem(editingItemIndex, item)
                  : undefined
              }
            />
          </div>
        )}
      </CardBody>
    </Card>
  );
}
