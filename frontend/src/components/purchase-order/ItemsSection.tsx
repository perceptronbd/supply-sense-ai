import { Button, Card, CardBody, CardHeader } from '@heroui/react';
import {
  type PurchaseOrderFormData,
  type PurchaseOrderItemFormData,
} from '../../lib/schemas/purchase-order.schema';
import { PlusIcon } from '../icons';
import { ItemCard } from '../ui/ItemCard';
import { PurchaseOrderItemForm } from './PurchaseOrderItemForm';

interface ItemsSectionProps {
  formData: Partial<PurchaseOrderFormData>;
  errors: Record<string, string[]>;
  wasSubmitted: boolean;
  showItemForm: boolean;
  editingItemIndex: number | null;
  calculateTotalAmount: () => number;
  handleAddItem: (item: PurchaseOrderItemFormData) => void;
  handleEditItem: (index: number) => void;
  handleRemoveItem: (index: number) => void;
  setShowItemForm: (show: boolean) => void;
  setEditingItemIndex: (index: number | null) => void;
}

export function ItemsSection({
  formData,
  errors,
  wasSubmitted,
  showItemForm,
  editingItemIndex,
  calculateTotalAmount,
  handleAddItem,
  handleEditItem,
  handleRemoveItem,
  setShowItemForm,
  setEditingItemIndex,
}: ItemsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center w-full">
          <h3 className="text-xl font-semibold">Items</h3>
        </div>
      </CardHeader>
      <CardBody>
        {errors.items && (
          <div className="mb-4 text-danger text-sm">
            {errors.items.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        )}

        {showItemForm && (
          <div className="mb-6">
            <PurchaseOrderItemForm
              item={editingItemIndex !== null ? formData.items?.[editingItemIndex] : undefined}
              onSave={handleAddItem}
              onCancel={() => {
                setShowItemForm(false);
                setEditingItemIndex(null);
              }}
              wasSubmitted={wasSubmitted}
              branchId={formData.branchId}
            />
          </div>
        )}

        {formData.items && formData.items.length > 0 && (
          <div className="space-y-4">
            {formData.items.map((item, index) => (
              <ItemCard
                key={`${item.itemId}-${index}`}
                item={item}
                index={index}
                type="purchase-order"
                onEdit={handleEditItem}
                onRemove={handleRemoveItem}
              />
            ))}

            {/* Total Amount */}
            <div className="border-t border-divider pt-4">
              <div className="text-right">
                <p className="text-lg font-semibold">
                  Total Amount: ${calculateTotalAmount().toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Add Item Container - Show when not currently adding an item */}
        {!showItemForm && (
          <div className="text-center py-8 text-default-500 border-dashed border-2 border-default-300 bg-content1 rounded-lg mt-4">
            <p className="mb-4">
              {formData.items && formData.items.length > 0
                ? "Click 'Add Item' to add another item"
                : "No items added yet. Click 'Add Item' to get started"}
            </p>
            <Button
              type="button"
              color="primary"
              variant="bordered"
              className="bg-content1 hover:bg-content2"
              onPress={() => {
                setEditingItemIndex(null);
                setShowItemForm(true);
              }}
              startContent={<PlusIcon className="w-4 h-4" />}
            >
              Add Item
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
