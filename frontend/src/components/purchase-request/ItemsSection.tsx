import { AiIcon, PlusIcon } from '@/components/icons';
import { ItemCard } from '@/components/ui/ItemCard';
import { Text } from '@/components/ui/Text';
import {
  type PurchaseRequestFormData,
  type PurchaseRequestItemFormData,
} from '@/lib/schemas/purchase-request.schema';
import { Button, Card, CardBody, CardHeader } from '@heroui/react';
import { PurchaseRequestItemForm } from './PurchaseRequestItemForm';

interface ItemsSectionProps {
  formData: Partial<PurchaseRequestFormData>;
  errors: Record<string, string[]>;
  wasSubmitted: boolean;
  showItemForm: boolean;
  editingItemIndex: number | null;
  isGeneratingRecommendations: boolean;
  calculateTotalAmount: () => number;
  handleGenerateRecommendations: () => void;
  handleAddItem: (item: PurchaseRequestItemFormData) => void;
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
  isGeneratingRecommendations,
  calculateTotalAmount,
  handleGenerateRecommendations,
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
          <Text variant="titleLarge" weight="semiBold" as="h3">
            Items
          </Text>
          <div className="flex gap-2">
            <Button
              type="button"
              color="secondary"
              variant="flat"
              onPress={() => {
                console.log('🔵 Generate AI Recommendations button clicked');
                handleGenerateRecommendations();
              }}
              isLoading={isGeneratingRecommendations}
              disabled={isGeneratingRecommendations}
              startContent={!isGeneratingRecommendations ? <AiIcon className="w-4 h-4" /> : null}
            >
              {isGeneratingRecommendations ? 'Generating...' : 'Generate AI Recommendations'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardBody>
        {errors.items && (
          <div className="mb-4 text-danger text-sm">
            {errors.items.map((error) => (
              <Text key={error} variant="bodySmall" color="danger" as="p">
                {error}
              </Text>
            ))}
          </div>
        )}

        {showItemForm && (
          <div className="mb-6">
            <PurchaseRequestItemForm
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
                type="purchase-request"
                onEdit={handleEditItem}
                onRemove={handleRemoveItem}
              />
            ))}

            {/* Total Amount */}
            <div className="border-t border-divider pt-4">
              <div className="text-right">
                <Text variant="titleMedium" weight="semiBold" as="p">
                  Total Estimated Amount: ${calculateTotalAmount().toFixed(2)}
                </Text>
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
