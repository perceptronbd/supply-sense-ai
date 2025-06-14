import { Text } from '@/components/ui/Text';
import { ValidatedInput } from '@/components/ui/ValidatedInput';
import { ValidatedSelect } from '@/components/ui/ValidatedSelect';
import { ValidatedTextarea } from '@/components/ui/ValidatedTextarea';
import { type GRItemFormData, grItemSchema } from '@/lib/schemas/goods-receipt.schema';
import { useGetItemsQuery } from '@/store/api/itemApi';
import { Button, Card, CardBody, CardHeader } from '@heroui/react';
import { useState } from 'react';

interface GoodsReceiptItemFormProps {
  onSave: (item: GRItemFormData) => void;
  onCancel: () => void;
  editingItem?: GRItemFormData;
  onEdit?: (item: GRItemFormData) => void;
}

export function GoodsReceiptItemForm({
  onSave,
  onCancel,
  editingItem,
  onEdit,
}: GoodsReceiptItemFormProps) {
  const [formData, setFormData] = useState<GRItemFormData>({
    itemId: editingItem?.itemId || '',
    orderedQty: editingItem?.orderedQty || 0,
    receivedQty: editingItem?.receivedQty || 0,
    unitPrice: editingItem?.unitPrice || 0,
    qualityNotes: editingItem?.qualityNotes || '',
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [wasSubmitted, setWasSubmitted] = useState(false);

  // Fetch items for dropdown
  const { data: itemsResponse } = useGetItemsQuery({});
  const items = itemsResponse?.data || [];

  const itemOptions = items.map((item) => ({
    value: item.id,
    label: `${item.name} (${item.sku})`,
  }));

  const handleFieldChange = (name: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear errors for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: [] }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setWasSubmitted(true);

    try {
      const validatedData = grItemSchema.parse(formData);

      if (editingItem && onEdit) {
        onEdit(validatedData);
      } else {
        onSave(validatedData);
      }
    } catch (error: unknown) {
      const zodError = error as { issues?: Array<{ path: string[]; message: string }> };
      if (zodError?.issues) {
        const validationErrors: Record<string, string[]> = {};
        for (const issue of zodError.issues) {
          const path = issue.path.join('.');
          if (!validationErrors[path]) {
            validationErrors[path] = [];
          }
          validationErrors[path].push(issue.message);
        }
        setErrors(validationErrors);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <Text variant="titleMedium" weight="semiBold" as="h3">
          {editingItem ? 'Edit Item' : 'Add Item'}
        </Text>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ValidatedSelect
              name="itemId"
              label="Item"
              isRequired
              wasSubmitted={wasSubmitted}
              fieldSchema={grItemSchema.shape.itemId}
              errors={errors.itemId}
              options={itemOptions}
              defaultSelectedKeys={formData.itemId ? [formData.itemId] : []}
              onValueChange={(value) => handleFieldChange('itemId', value)}
            />
            <ValidatedInput
              name="orderedQty"
              type="number"
              label="Ordered Quantity"
              required
              wasSubmitted={wasSubmitted}
              fieldSchema={grItemSchema.shape.orderedQty}
              errors={errors.orderedQty}
              defaultValue={formData.orderedQty.toString()}
              onValueChange={(value) =>
                handleFieldChange('orderedQty', Number.parseFloat(value) || 0)
              }
            />
            <ValidatedInput
              name="receivedQty"
              type="number"
              label="Received Quantity"
              required
              wasSubmitted={wasSubmitted}
              fieldSchema={grItemSchema.shape.receivedQty}
              errors={errors.receivedQty}
              defaultValue={formData.receivedQty.toString()}
              onValueChange={(value) =>
                handleFieldChange('receivedQty', Number.parseFloat(value) || 0)
              }
            />
            <ValidatedInput
              name="unitPrice"
              type="number"
              step="0.01"
              label="Unit Price"
              wasSubmitted={wasSubmitted}
              fieldSchema={grItemSchema.shape.unitPrice}
              errors={errors.unitPrice}
              defaultValue={formData.unitPrice?.toString() || ''}
              onValueChange={(value) =>
                handleFieldChange('unitPrice', Number.parseFloat(value) || 0)
              }
            />
            <div className="md:col-span-2">
              <ValidatedTextarea
                name="qualityNotes"
                label="Quality Notes"
                wasSubmitted={wasSubmitted}
                fieldSchema={grItemSchema.shape.qualityNotes}
                errors={errors.qualityNotes}
                defaultValue={formData.qualityNotes}
                placeholder="Enter any quality observations or notes"
                onValueChange={(value) => handleFieldChange('qualityNotes', value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="light" onPress={onCancel}>
              Cancel
            </Button>
            <Button type="submit" color="primary">
              {editingItem ? 'Update Item' : 'Add Item'}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
