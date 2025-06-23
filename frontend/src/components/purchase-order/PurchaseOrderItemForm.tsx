'use client';

import { ItemSelector } from '@/components/ui/ItemSelector';
import { ValidatedDateInput } from '@/components/ui/ValidatedDateInput';
import { ValidatedInput } from '@/components/ui/ValidatedInput';
import { ValidatedTextarea } from '@/components/ui/ValidatedTextarea';
import {
  type PurchaseOrderItemFormData,
  purchaseOrderItemSchema,
} from '@/lib/schemas/purchase-order.schema';
import { Button } from '@heroui/react';
import { useState } from 'react';

interface PurchaseOrderItemFormProps {
  item?: Partial<PurchaseOrderItemFormData>;
  onSave: (item: PurchaseOrderItemFormData) => void;
  onCancel: () => void;
  wasSubmitted: boolean;
  branchId?: string;
}

export function PurchaseOrderItemForm({
  item,
  onSave,
  onCancel,
  wasSubmitted,
  branchId,
}: PurchaseOrderItemFormProps) {
  // Default delivery date to today
  const getDefaultDeliveryDate = () => new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState<Partial<PurchaseOrderItemFormData>>(() => {
    if (item) {
      return {
        ...item,
        deliveryDate: item.deliveryDate || getDefaultDeliveryDate(),
      };
    }
    return {
      itemId: '',
      orderedQty: 0,
      unitPrice: 0,
      deliveryDate: getDefaultDeliveryDate(),
      remarks: '',
    };
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = () => {
    // Since handleFieldChange already converts the values, use formData directly
    // but ensure proper type conversion for any edge cases
    const submissionData = {
      ...formData,
      orderedQty:
        typeof formData.orderedQty === 'number'
          ? formData.orderedQty
          : Number(formData.orderedQty) || 0,
      unitPrice:
        typeof formData.unitPrice === 'number'
          ? formData.unitPrice
          : Number(formData.unitPrice) || 0,
    };

    const validation = purchaseOrderItemSchema.safeParse(submissionData);

    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors;
      setErrors(fieldErrors);
      return;
    }

    onSave(validation.data);
  };
  const convertNumericValue = (value: string): number => {
    if (value === '') {
      return 0;
    }
    const numValue = Number.parseFloat(value);
    return Number.isNaN(numValue) ? 0 : numValue;
  };

  const handleFieldChange = (name: string, value: string) => {
    const processedValue =
      name === 'orderedQty' || name === 'unitPrice' ? convertNumericValue(value) : value;

    setFormData((prev) => ({ ...prev, [name]: processedValue }));

    // Clear errors for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: [] }));
    }
  };

  return (
    <div className="space-y-4 bg-content1 p-6 rounded-lg border border-divider">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-foreground">{item ? 'Edit Item' : 'Add Item'}</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Item Selection */}
        <div className="md:col-span-2">
          <ItemSelector
            value={formData.itemId}
            onChange={(itemId, _selectedItem) => {
              setFormData((prev) => ({ ...prev, itemId }));
              // Clear errors for this field when user makes a selection
              if (errors.itemId) {
                setErrors((prev) => ({ ...prev, itemId: [] }));
              }
            }}
            branchId={branchId}
            label="Item"
            isRequired={true}
            isInvalid={wasSubmitted && !!errors.itemId}
            errorMessage={errors.itemId?.[0]}
          />
        </div>
        {/* Ordered Quantity */}
        <ValidatedInput
          name="orderedQty"
          type="number"
          label="Ordered Quantity"
          required
          variant="bordered"
          wasSubmitted={wasSubmitted}
          fieldSchema={purchaseOrderItemSchema.shape.orderedQty}
          errors={errors.orderedQty}
          defaultValue={formData.orderedQty?.toString()}
          min="0"
          step="0.001"
          onValueChange={handleFieldChange}
        />
        {/* Unit Price */}
        <ValidatedInput
          name="unitPrice"
          type="number"
          label="Unit Price"
          required
          variant="bordered"
          wasSubmitted={wasSubmitted}
          fieldSchema={purchaseOrderItemSchema.shape.unitPrice}
          errors={errors.unitPrice}
          defaultValue={formData.unitPrice?.toString()}
          min="0"
          step="0.01"
          onValueChange={handleFieldChange}
        />{' '}
        {/* Delivery Date */}
        <div className="md:col-span-2">
          <ValidatedDateInput
            name="deliveryDate"
            label="Expected Delivery Date"
            isRequired
            variant="bordered"
            wasSubmitted={wasSubmitted}
            fieldSchema={purchaseOrderItemSchema.shape.deliveryDate}
            errors={errors.deliveryDate}
            defaultValue={formData.deliveryDate}
            onValueChange={handleFieldChange}
          />
        </div>
        {/* Remarks */}
        <div className="md:col-span-2">
          <ValidatedTextarea
            name="remarks"
            label="Remarks"
            variant="bordered"
            wasSubmitted={wasSubmitted}
            fieldSchema={purchaseOrderItemSchema.shape.remarks}
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
        <Button type="button" color="primary" onPress={handleSubmit}>
          {item ? 'Update Item' : 'Add Item'}
        </Button>
      </div>
    </div>
  );
}
