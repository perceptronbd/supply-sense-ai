'use client';

import { Button, Card, CardBody, CardHeader } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  type PurchaseOrderFormData,
  purchaseOrderSchema,
} from '../../lib/schemas/purchase-order.schema';
import { useGetAllBranchesQuery } from '../../store/api/branchApi';
import { type PurchaseOrder } from '../../store/api/purchaseOrderApi';
import { useGetSuppliersQuery } from '../../store/api/supplierApi';
import type { RootState } from '../../store/store';
import { Text } from '../ui/Text';
import { ValidatedDateInput } from '../ui/ValidatedDateInput';
import { ValidatedInput } from '../ui/ValidatedInput';
import { ValidatedSelect } from '../ui/ValidatedSelect';
import { ValidatedTextarea } from '../ui/ValidatedTextarea';
import { ItemsSection } from './ItemsSection';
import { useFormSubmission, useItemManagement } from './hooks';

interface PurchaseOrderFormProps {
  id?: string; // Purchase Order ID for editing
  initialData?: Partial<PurchaseOrderFormData>;
  mode?: 'create' | 'edit';
  onSuccess?: (purchaseOrder: PurchaseOrder) => void;
}

export function PurchaseOrderForm({
  id,
  initialData,
  mode = 'create',
  onSuccess,
}: PurchaseOrderFormProps) {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  // Helper function to normalize initial data
  const normalizeInitialData = (data?: Partial<PurchaseOrderFormData>) => {
    // Default expected delivery date to tomorrow
    const defaultExpectedDeliveryDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    if (!data) {
      return {
        title: '',
        prId: '',
        supplierId: '',
        expectedDeliveryDate: defaultExpectedDeliveryDate,
        paymentTerms: '',
        deliveryTerms: '',
        branchId: user?.branchId || '',
        notes: '',
        items: [],
      };
    }

    return {
      ...data,
      // Ensure expectedDeliveryDate has a default value if not provided
      expectedDeliveryDate: data.expectedDeliveryDate || defaultExpectedDeliveryDate,
      items:
        data.items?.map((item) => ({
          ...item,
          orderedQty: Number(item.orderedQty) || 0,
          unitPrice: Number(item.unitPrice) || 0,
        })) || [],
    };
  };

  const [formData, setFormData] = useState<Partial<PurchaseOrderFormData>>(
    normalizeInitialData(initialData)
  );
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [wasSubmitted, setWasSubmitted] = useState(false);

  // API queries
  const { data: branches = [] } = useGetAllBranchesQuery(undefined);
  const { data: suppliers = [] } = useGetSuppliersQuery();

  // Create branch and supplier options
  const branchOptions = branches.map((branch) => ({
    value: branch.id,
    label: `${branch.code} - ${branch.name}`,
  }));

  const supplierOptions = suppliers.map((supplier) => ({
    value: supplier.id,
    label: `${supplier.code} - ${supplier.name}`,
  }));

  // Use custom hooks
  const { handleSubmit, isCreating, isUpdating } = useFormSubmission({
    mode,
    id,
    formData,
    onSuccess,
  });

  const {
    showItemForm,
    setShowItemForm,
    editingItemIndex,
    setEditingItemIndex,
    handleAddItem,
    handleEditItem,
    handleRemoveItem,
    calculateTotalAmount,
  } = useItemManagement({
    formData,
    setFormData,
    errors,
    setErrors,
  });
  // Helper functions
  const handleFieldChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear errors for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: [] }));
    }
  };

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <Text variant="headerSmall" weight="bold" as="h1">
            {mode === 'create' ? 'Create Purchase Order' : 'Edit Purchase Order'}
          </Text>
          <Text variant="bodyBase" className="text-default-500 mt-2" as="p">
            {mode === 'create'
              ? 'Create a new purchase order for your branch'
              : 'Update the purchase order details'}
          </Text>
        </div>
      </header>

      {errors._form && (
        <div className="bg-danger-50 border border-danger-200 rounded-md p-4">
          <div className="text-danger-800">
            {errors._form.map((error) => (
              <Text variant="bodyBase" key={error} as="p">
                {error}
              </Text>
            ))}
          </div>
        </div>
      )}

      <form className="space-y-6" onSubmit={(e) => handleSubmit(e, setErrors, setWasSubmitted)}>
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <h3 className="text-xl font-semibold">Basic Information</h3>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <ValidatedInput
                  name="title"
                  type="text"
                  label="Title"
                  required
                  wasSubmitted={wasSubmitted}
                  fieldSchema={purchaseOrderSchema.shape.title}
                  errors={errors.title}
                  defaultValue={formData.title}
                  placeholder="Enter a descriptive title for this purchase order"
                  onValueChange={handleFieldChange}
                />
              </div>
              <ValidatedSelect
                name="supplierId"
                label="Supplier"
                required
                wasSubmitted={wasSubmitted}
                fieldSchema={purchaseOrderSchema.shape.supplierId}
                errors={errors.supplierId}
                options={supplierOptions}
                defaultValue={formData.supplierId}
                onValueChange={handleFieldChange}
              />
              <ValidatedSelect
                name="branchId"
                label="Branch"
                required
                wasSubmitted={wasSubmitted}
                fieldSchema={purchaseOrderSchema.shape.branchId}
                errors={errors.branchId}
                options={branchOptions}
                defaultValue={formData.branchId}
                onValueChange={handleFieldChange}
              />{' '}
              <ValidatedDateInput
                name="expectedDeliveryDate"
                label="Expected Delivery Date"
                required
                wasSubmitted={wasSubmitted}
                fieldSchema={purchaseOrderSchema.shape.expectedDeliveryDate}
                errors={errors.expectedDeliveryDate}
                defaultValue={formData.expectedDeliveryDate}
                onValueChange={handleFieldChange}
              />
              <ValidatedInput
                name="paymentTerms"
                type="text"
                label="Payment Terms"
                wasSubmitted={wasSubmitted}
                fieldSchema={purchaseOrderSchema.shape.paymentTerms}
                errors={errors.paymentTerms}
                defaultValue={formData.paymentTerms}
                placeholder="e.g., Net 30 days"
                onValueChange={handleFieldChange}
              />
              <ValidatedInput
                name="deliveryTerms"
                type="text"
                label="Delivery Terms"
                wasSubmitted={wasSubmitted}
                fieldSchema={purchaseOrderSchema.shape.deliveryTerms}
                errors={errors.deliveryTerms}
                defaultValue={formData.deliveryTerms}
                placeholder="e.g., FOB Origin"
                onValueChange={handleFieldChange}
              />
              <div className="md:col-span-2">
                <ValidatedTextarea
                  name="notes"
                  label="Notes"
                  wasSubmitted={wasSubmitted}
                  fieldSchema={purchaseOrderSchema.shape.notes}
                  errors={errors.notes}
                  defaultValue={formData.notes}
                  rows={3}
                  placeholder="Any additional notes or special requirements"
                  onValueChange={handleFieldChange}
                />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Items Section */}
        <ItemsSection
          formData={formData}
          errors={errors}
          wasSubmitted={wasSubmitted}
          showItemForm={showItemForm}
          editingItemIndex={editingItemIndex}
          calculateTotalAmount={calculateTotalAmount}
          handleAddItem={handleAddItem}
          handleEditItem={handleEditItem}
          handleRemoveItem={handleRemoveItem}
          setShowItemForm={setShowItemForm}
          setEditingItemIndex={setEditingItemIndex}
        />

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="flat" color="default" onPress={() => router.back()}>
            Cancel
          </Button>
          <Button
            type="submit"
            color="primary"
            isLoading={isCreating || isUpdating}
            disabled={isCreating || isUpdating}
          >
            {mode === 'create' ? 'Create Purchase Order' : 'Update Purchase Order'}
          </Button>
        </div>
      </form>
    </main>
  );
}
