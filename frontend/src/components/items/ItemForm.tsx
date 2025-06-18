'use client';

import { ArrowLeftIcon } from '@/components/icons';
import { Text } from '@/components/ui/Text';
import { ValidatedInput } from '@/components/ui/ValidatedInput';
import {
  type CreateItemFormData,
  type UpdateItemFormData,
  createItemSchema,
  itemFieldSchemas,
  updateItemSchema,
} from '@/lib/schemas/item.schema';
import {
  type CreateItemRequest,
  type Item,
  type UpdateItemRequest,
  useCreateItemMutation,
  useUpdateItemMutation,
} from '@/store/api/itemApi';
import { Button } from '@heroui/button';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Checkbox } from '@heroui/checkbox';
import { addToast } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ItemFormProps {
  item?: Item;
  mode: 'create' | 'edit';
  onSuccess?: (item: Item) => void;
}

export function ItemForm({ item, mode, onSuccess }: ItemFormProps) {
  const router = useRouter();
  const [createItem, { isLoading: isCreating }] = useCreateItemMutation();
  const [updateItem, { isLoading: isUpdating }] = useUpdateItemMutation();

  const isLoading = isCreating || isUpdating;
  const [formData, setFormData] = useState<CreateItemFormData>({
    name: '',
    sku: '',
    description: '',
    mainUnit: '',
    buyingUnit: '',
    transferUnit: '',
    usingUnit: '',
    buyingToMainRate: 1,
    transferToMainRate: 1,
    usingToMainRate: 1,
    safetyStockLevel: 0,
    reorderLevel: 0,
    isActive: true,
  });

  const [wasSubmitted, setWasSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (item && mode === 'edit') {
      setFormData({
        name: item.name,
        sku: item.sku,
        description: item.description || '',
        mainUnit: item.mainUnit,
        buyingUnit: item.buyingUnit || '',
        transferUnit: item.transferUnit || '',
        usingUnit: item.usingUnit || '',
        buyingToMainRate: 1, // These rates might not be in the Item type
        transferToMainRate: 1,
        usingToMainRate: 1,
        safetyStockLevel: 0,
        reorderLevel: 0,
        isActive: item.isActive,
      });
    }
  }, [item, mode]);

  const updateNumericField = (
    data: CreateItemFormData,
    fieldName: string,
    value: string
  ): CreateItemFormData => {
    const numValue = Number.parseFloat(value);
    const finalValue = Number.isNaN(numValue) ? 0 : numValue;

    switch (fieldName) {
      case 'buyingToMainRate':
        return { ...data, buyingToMainRate: finalValue };
      case 'transferToMainRate':
        return { ...data, transferToMainRate: finalValue };
      case 'usingToMainRate':
        return { ...data, usingToMainRate: finalValue };
      case 'safetyStockLevel':
        return { ...data, safetyStockLevel: finalValue };
      case 'reorderLevel':
        return { ...data, reorderLevel: finalValue };
      default:
        return data;
    }
  };

  const updateStringField = (
    data: CreateItemFormData,
    fieldName: string,
    value: string
  ): CreateItemFormData => {
    switch (fieldName) {
      case 'name':
        return { ...data, name: value };
      case 'sku':
        return { ...data, sku: value };
      case 'description':
        return { ...data, description: value };
      case 'mainUnit':
        return { ...data, mainUnit: value };
      case 'buyingUnit':
        return { ...data, buyingUnit: value };
      case 'transferUnit':
        return { ...data, transferUnit: value };
      case 'usingUnit':
        return { ...data, usingUnit: value };
      default:
        return data;
    }
  };

  const handleValueChange = (name: string, value: string) => {
    setFormData((prev) => {
      const numericFields = [
        'buyingToMainRate',
        'transferToMainRate',
        'usingToMainRate',
        'safetyStockLevel',
        'reorderLevel',
      ];

      if (numericFields.includes(name)) {
        return updateNumericField(prev, name, value);
      }
      return updateStringField(prev, name, value);
    });

    // Clear field errors when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: [] }));
    }
  };

  const validateForm = (): boolean => {
    const schema = mode === 'create' ? createItemSchema : updateItemSchema;
    const validationResult = schema.safeParse(formData);

    if (validationResult.success) {
      setFieldErrors({});
      return true;
    }

    // Convert Zod errors to field errors
    const errors: Record<string, string[]> = {};
    for (const issue of validationResult.error.issues) {
      const fieldName = issue.path[0] as string;
      if (!errors[fieldName]) {
        errors[fieldName] = [];
      }
      errors[fieldName].push(issue.message);
    }

    setFieldErrors(errors);
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWasSubmitted(true);

    if (!validateForm()) {
      return;
    }

    try {
      let result: Item;

      if (mode === 'create') {
        result = await createItem(formData).unwrap();
        addToast({
          title: 'Success',
          description: 'Item created successfully',
          color: 'success',
          variant: 'flat',
        });
      } else if (mode === 'edit' && item) {
        result = await updateItem({ id: item.id, data: formData }).unwrap();
        addToast({
          title: 'Success',
          description: 'Item updated successfully',
          color: 'success',
          variant: 'flat',
        });
      } else {
        throw new Error('Invalid mode or missing item for edit');
      }

      // Call success callback or navigate to items list
      if (onSuccess) {
        onSuccess(result);
      } else {
        router.push('/items');
      }
    } catch (error) {
      console.error('Error submitting item:', error);
      addToast({
        title: 'Error',
        description: mode === 'create' ? 'Failed to create item' : 'Failed to update item',
        color: 'danger',
        variant: 'flat',
      });
    }
  };

  const handleCancel = () => {
    router.push('/items');
  };

  return (
    <main className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
        {' '}
        {/* Header with back button */}
        <header className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Text variant="headerSmall" weight="bold" as="h1">
              {mode === 'create' ? 'Create New Item' : 'Edit Item'}
            </Text>
            <Button
              variant="light"
              onPress={handleCancel}
              startContent={<ArrowLeftIcon className="w-4 h-4" />}
              aria-label="Go back to items list"
            >
              Back
            </Button>
          </div>
        </header>
        {/* Basic Information Card */}
        <Card>
          <CardHeader>
            <Text variant="titleSmall" as="h2">
              Basic Information
            </Text>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ValidatedInput
                name="name"
                label="Item Name"
                placeholder="Enter item name"
                defaultValue={formData.name}
                fieldSchema={itemFieldSchemas.name}
                wasSubmitted={wasSubmitted}
                errors={fieldErrors.name}
                onValueChange={handleValueChange}
                variant="bordered"
                isRequired
              />
              <ValidatedInput
                name="sku"
                label="SKU"
                placeholder="Enter SKU"
                defaultValue={formData.sku}
                fieldSchema={itemFieldSchemas.sku}
                wasSubmitted={wasSubmitted}
                errors={fieldErrors.sku}
                onValueChange={handleValueChange}
                variant="bordered"
                isRequired
              />
            </div>

            <ValidatedInput
              name="description"
              label="Description"
              placeholder="Enter item description (optional)"
              defaultValue={formData.description}
              fieldSchema={itemFieldSchemas.description}
              wasSubmitted={wasSubmitted}
              errors={fieldErrors.description}
              onValueChange={handleValueChange}
              variant="bordered"
            />
          </CardBody>
        </Card>
        {/* Units & Conversion Rates Card */}
        <Card>
          <CardHeader>
            <Text variant="titleSmall" as="h2">
              Units & Conversion Rates
            </Text>
          </CardHeader>
          <CardBody className="space-y-6">
            {/* Units Section */}
            <div className="space-y-4">
              <Text variant="bodyXSmall" weight={'light'}>
                Unit Management
              </Text>
              {/* Main Unit - Full Width */}
              <div className="w-full md:w-1/2">
                <ValidatedInput
                  name="mainUnit"
                  label="Main Unit"
                  placeholder="e.g., kg, pcs"
                  defaultValue={formData.mainUnit}
                  fieldSchema={itemFieldSchemas.mainUnit}
                  wasSubmitted={wasSubmitted}
                  errors={fieldErrors.mainUnit}
                  onValueChange={handleValueChange}
                  variant="bordered"
                  isRequired
                />
              </div>
              {/* Other Units - Grouped Together */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ValidatedInput
                  name="buyingUnit"
                  label="Buying Unit"
                  placeholder="e.g., ton, box"
                  defaultValue={formData.buyingUnit}
                  fieldSchema={itemFieldSchemas.buyingUnit}
                  wasSubmitted={wasSubmitted}
                  errors={fieldErrors.buyingUnit}
                  onValueChange={handleValueChange}
                  variant="bordered"
                  isRequired
                />
                <ValidatedInput
                  name="transferUnit"
                  label="Transfer Unit"
                  placeholder="e.g., kg, pcs"
                  defaultValue={formData.transferUnit}
                  fieldSchema={itemFieldSchemas.transferUnit}
                  wasSubmitted={wasSubmitted}
                  errors={fieldErrors.transferUnit}
                  onValueChange={handleValueChange}
                  variant="bordered"
                  isRequired
                />
                <ValidatedInput
                  name="usingUnit"
                  label="Using Unit"
                  placeholder="e.g., kg, pcs"
                  defaultValue={formData.usingUnit}
                  fieldSchema={itemFieldSchemas.usingUnit}
                  wasSubmitted={wasSubmitted}
                  errors={fieldErrors.usingUnit}
                  onValueChange={handleValueChange}
                  variant="bordered"
                  isRequired
                />
              </div>
            </div>
            {/* Conversion Rates */}
            <div className="space-y-4">
              <Text variant="bodyXSmall" weight={'light'}>
                Conversion Rates
              </Text>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ValidatedInput
                  name="buyingToMainRate"
                  type="number"
                  label="Buying to Main Rate"
                  placeholder="1"
                  defaultValue={formData.buyingToMainRate?.toString()}
                  fieldSchema={itemFieldSchemas.buyingToMainRate}
                  wasSubmitted={wasSubmitted}
                  errors={fieldErrors.buyingToMainRate}
                  onValueChange={handleValueChange}
                  variant="bordered"
                  step="0.000001"
                  min="0.000001"
                />
                <ValidatedInput
                  name="transferToMainRate"
                  type="number"
                  label="Transfer to Main Rate"
                  placeholder="1"
                  defaultValue={formData.transferToMainRate?.toString()}
                  fieldSchema={itemFieldSchemas.transferToMainRate}
                  wasSubmitted={wasSubmitted}
                  errors={fieldErrors.transferToMainRate}
                  onValueChange={handleValueChange}
                  variant="bordered"
                  step="0.000001"
                  min="0.000001"
                />
                <ValidatedInput
                  name="usingToMainRate"
                  type="number"
                  label="Using to Main Rate"
                  placeholder="1"
                  defaultValue={formData.usingToMainRate?.toString()}
                  fieldSchema={itemFieldSchemas.usingToMainRate}
                  wasSubmitted={wasSubmitted}
                  errors={fieldErrors.usingToMainRate}
                  onValueChange={handleValueChange}
                  variant="bordered"
                  step="0.000001"
                  min="0.000001"
                />
              </div>
            </div>
          </CardBody>
        </Card>
        {/* Stock & Status Card */}
        <Card>
          <CardHeader>
            <Text variant="titleSmall" as="h2">
              Stock & Status
            </Text>
          </CardHeader>
          <CardBody className="space-y-6">
            {/* Stock Management */}
            <div className="space-y-4">
              <Text variant="bodyXSmall" weight={'light'}>
                Stock Management
              </Text>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ValidatedInput
                  name="safetyStockLevel"
                  type="number"
                  label="Safety Stock Level"
                  placeholder="0"
                  defaultValue={formData.safetyStockLevel?.toString()}
                  fieldSchema={itemFieldSchemas.safetyStockLevel}
                  wasSubmitted={wasSubmitted}
                  errors={fieldErrors.safetyStockLevel}
                  onValueChange={handleValueChange}
                  variant="bordered"
                  step="0.001"
                  min="0"
                />
                <ValidatedInput
                  name="reorderLevel"
                  type="number"
                  label="Reorder Level"
                  placeholder="0"
                  defaultValue={formData.reorderLevel?.toString()}
                  fieldSchema={itemFieldSchemas.reorderLevel}
                  wasSubmitted={wasSubmitted}
                  errors={fieldErrors.reorderLevel}
                  onValueChange={handleValueChange}
                  variant="bordered"
                  step="0.001"
                  min="0"
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-4">
              <Text variant="bodyXSmall" weight={'light'}>
                Item Status
              </Text>
              <Checkbox
                isSelected={formData.isActive}
                onValueChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked }))}
              >
                Active Item
              </Checkbox>
            </div>
          </CardBody>
        </Card>
        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="light" onPress={handleCancel} isDisabled={isLoading}>
            Cancel
          </Button>
          <Button color="primary" type="submit" isLoading={isLoading}>
            {isLoading
              ? mode === 'create'
                ? 'Creating...'
                : 'Updating...'
              : mode === 'create'
                ? 'Create Item'
                : 'Update Item'}
          </Button>
        </div>
      </form>
    </main>
  );
}
