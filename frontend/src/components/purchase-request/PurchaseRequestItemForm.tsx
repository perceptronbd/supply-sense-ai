'use client';

import { Button } from '@heroui/react';
import { useState } from 'react';
import {
  type PurchaseRequestItemFormData,
  purchaseRequestItemSchema,
} from '../../lib/schemas/purchase-request.schema';
import type { Item } from '../../store/api/itemApi';
import { ItemSelector } from '../ui/ItemSelector';
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

  const handleSubmit = () => {
    // Since handleFieldChange already converts the values, use formData directly
    // but ensure proper type conversion for any edge cases
    const submissionData = {
      ...formData,
      requestedQty:
        typeof formData.requestedQty === 'number'
          ? formData.requestedQty
          : Number(formData.requestedQty) || 0,
      estimatedPrice:
        formData.estimatedPrice === undefined
          ? undefined
          : typeof formData.estimatedPrice === 'number'
            ? formData.estimatedPrice
            : Number(formData.estimatedPrice) || 0,
    };

    const validation = purchaseRequestItemSchema.safeParse(submissionData);

    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors;
      setErrors(fieldErrors);
      return;
    }

    onSave(validation.data);
  };

  const convertNumericValue = (name: string, value: string): string | number | undefined => {
    if (value === '') {
      return name === 'estimatedPrice' ? undefined : value;
    }
    const numValue = Number.parseFloat(value);
    return Number.isNaN(numValue) ? value : numValue;
  };

  const handleFieldChange = (name: string, value: string) => {
    const processedValue =
      name === 'requestedQty' || name === 'estimatedPrice'
        ? convertNumericValue(name, value)
        : value;

    setFormData((prev) => ({ ...prev, [name]: processedValue }));

    // Clear errors for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: [] }));
    }
  };

  // Set default required date to today if not set
  const defaultRequiredDate = formData.requiredDate || new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-4 bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">{item ? 'Edit Item' : 'Add Item'}</h3>
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
        <Button type="button" color="primary" onPress={handleSubmit}>
          {item ? 'Update Item' : 'Add Item'}
        </Button>
      </div>
    </div>
  );
}
