'use client';

import { Button } from '@heroui/react';
import { useState } from 'react';
import {
  type PurchaseRequestItemFormData,
  purchaseRequestItemSchema,
} from '../../lib/schemas/purchase-request.schema';
import { useGetItemsQuery } from '../../store/api/purchaseRequestApi';
import { ValidatedInput } from '../ui/ValidatedInput';
import { ValidatedSelect } from '../ui/ValidatedSelect';
import { ValidatedTextarea } from '../ui/ValidatedTextarea';

interface PurchaseRequestItemFormProps {
  item?: Partial<PurchaseRequestItemFormData>;
  onSave: (item: PurchaseRequestItemFormData) => void;
  onCancel: () => void;
  wasSubmitted: boolean;
  branchId?: string;
}

export function PurchaseRequestItemForm({
  item,
  onSave,
  onCancel,
  wasSubmitted,
  branchId,
}: PurchaseRequestItemFormProps) {
  const [formData, setFormData] = useState<Partial<PurchaseRequestItemFormData>>(
    item || {
      itemId: '',
      requestedQty: 0,
      estimatedPrice: undefined,
      requiredDate: '',
      remarks: '',
    }
  );
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  // Get items for the dropdown
  const { data: items = [], isLoading: itemsLoading } = useGetItemsQuery({
    branchId,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formDataWithNumbers = {
      ...formData,
      requestedQty: Number(formData.requestedQty) || 0,
      estimatedPrice: formData.estimatedPrice ? Number(formData.estimatedPrice) : undefined,
    };

    const validation = purchaseRequestItemSchema.safeParse(formDataWithNumbers);

    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors;
      setErrors(fieldErrors);
      return;
    }

    onSave(validation.data);
  };
  const handleFieldChange = (name: string, value: string) => {
    let processedValue: string | number = value;

    // Convert string values to numbers for numeric fields
    if (name === 'requestedQty' || name === 'estimatedPrice') {
      const numValue = Number.parseFloat(value);
      processedValue = Number.isNaN(numValue) ? 0 : numValue;
    }

    setFormData((prev) => ({ ...prev, [name]: processedValue }));
    // Clear errors for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: [] }));
    }
  };

  const itemOptions = items.map((item) => ({
    value: item.id,
    label: `${item.code} - ${item.name}`,
  }));

  // Set default required date to today if not set
  const defaultRequiredDate = formData.requiredDate || new Date().toISOString().split('T')[0];

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 bg-white p-6 rounded-lg border border-gray-200"
    >
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">{item ? 'Edit Item' : 'Add Item'}</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Item Selection */}
        <div className="md:col-span-2">
          {' '}
          <ValidatedSelect
            name="itemId"
            label="Item"
            required
            wasSubmitted={wasSubmitted}
            fieldSchema={purchaseRequestItemSchema.shape.itemId}
            errors={errors.itemId}
            options={itemOptions}
            placeholder={itemsLoading ? 'Loading items...' : 'Select an item'}
            defaultValue={formData.itemId}
            disabled={itemsLoading}
            onValueChange={handleFieldChange}
          />
        </div>
        {/* Requested Quantity */}{' '}
        <ValidatedInput
          name="requestedQty"
          type="number"
          label="Requested Quantity"
          required
          wasSubmitted={wasSubmitted}
          fieldSchema={purchaseRequestItemSchema.shape.requestedQty}
          errors={errors.requestedQty}
          defaultValue={formData.requestedQty?.toString()}
          min="0"
          step="0.001"
          onValueChange={handleFieldChange}
        />
        {/* Estimated Price */}{' '}
        <ValidatedInput
          name="estimatedPrice"
          type="number"
          label="Estimated Price (per unit)"
          wasSubmitted={wasSubmitted}
          fieldSchema={purchaseRequestItemSchema.shape.estimatedPrice}
          errors={errors.estimatedPrice}
          defaultValue={formData.estimatedPrice?.toString()}
          min="0"
          step="0.01"
          onValueChange={handleFieldChange}
        />
        {/* Required Date */}
        <div className="md:col-span-2">
          {' '}
          <ValidatedInput
            name="requiredDate"
            type="date"
            label="Required Date"
            required
            wasSubmitted={wasSubmitted}
            fieldSchema={purchaseRequestItemSchema.shape.requiredDate}
            errors={errors.requiredDate}
            defaultValue={defaultRequiredDate}
            onValueChange={handleFieldChange}
          />
        </div>
        {/* Remarks */}
        <div className="md:col-span-2">
          {' '}
          <ValidatedTextarea
            name="remarks"
            label="Remarks"
            wasSubmitted={wasSubmitted}
            fieldSchema={purchaseRequestItemSchema.shape.remarks}
            errors={errors.remarks}
            defaultValue={formData.remarks}
            rows={3}
            placeholder="Any additional notes or special requirements..."
            onValueChange={handleFieldChange}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="flat" color="default" onPress={onCancel}>
          Cancel
        </Button>
        <Button type="submit" color="primary">
          {item ? 'Update Item' : 'Add Item'}
        </Button>
      </div>
    </form>
  );
}
