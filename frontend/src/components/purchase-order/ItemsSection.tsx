import { Button, Card, CardBody, CardHeader } from '@heroui/react';
import {
  type PurchaseOrderFormData,
  type PurchaseOrderItemFormData,
} from '../../lib/schemas/purchase-order.schema';
import { PlusIcon } from '../icons';
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
              <div
                key={`${item.itemId}-${index}`}
                className="border border-divider rounded-lg p-4 bg-content2"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-default-500">Item ID</p>
                      <p className="font-medium">{item.itemId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-default-500">Quantity</p>
                      <p className="font-medium">{item.orderedQty}</p>
                    </div>
                    <div>
                      <p className="text-sm text-default-500">Unit Price</p>
                      <p className="font-medium">${Number(item.unitPrice).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-default-500">Delivery Date</p>
                      <p className="font-medium">
                        {new Date(item.deliveryDate).toLocaleDateString()}
                      </p>
                    </div>
                    {item.remarks && (
                      <div className="md:col-span-4">
                        <p className="text-sm text-default-500">Remarks</p>
                        <p className="font-medium">{item.remarks}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      type="button"
                      size="sm"
                      variant="flat"
                      color="primary"
                      onPress={() => handleEditItem(index)}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="flat"
                      color="danger"
                      onPress={() => handleRemoveItem(index)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
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
