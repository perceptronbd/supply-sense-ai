'use client';

import { Text } from '@/components/ui/Text';
import { ValidatedDateInput } from '@/components/ui/ValidatedDateInput';
import { ValidatedInput } from '@/components/ui/ValidatedInput';
import { ValidatedSelect } from '@/components/ui/ValidatedSelect';
import { ValidatedTextarea } from '@/components/ui/ValidatedTextarea';
import {
  type PurchaseOrderFormData,
  purchaseOrderSchema,
} from '@/lib/schemas/purchase-order.schema';
import { getToastErrorMessage } from '@/lib/utils/api-response';
import { useGetAllBranchesQuery } from '@/store/api/branchApi';
import { type PurchaseOrder } from '@/store/api/purchaseOrderApi';
import { useGetSuppliersQuery } from '@/store/api/supplierApi';
import type { RootState } from '@/store/store';
import { Button, Card, CardBody, CardHeader, addToast } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { ItemsSection } from './ItemsSection';
import { useFormSubmission, useItemManagement } from './hooks';

interface PurchaseOrderFormProps {
  readonly id?: string; // Purchase Order ID for editing
  readonly initialData?: Partial<PurchaseOrderFormData>;
  readonly mode?: 'create' | 'edit';
  readonly onSuccess?: (purchaseOrder: PurchaseOrder) => void;
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
        prId: undefined, // Optional field should be undefined, not empty string
        supplierId: '',
        expectedDeliveryDate: defaultExpectedDeliveryDate,
        paymentTerms: undefined, // Optional field should be undefined, not empty string
        deliveryTerms: undefined, // Optional field should be undefined, not empty string
        branchId: user?.branchId || '',
        notes: undefined, // Optional field should be undefined, not empty string
        items: [],
      };
    }

    return {
      ...data,
      // Ensure expectedDeliveryDate has a default value if not provided
      expectedDeliveryDate: data.expectedDeliveryDate ?? defaultExpectedDeliveryDate,
      // Convert empty strings to undefined for optional fields
      prId: data.prId || undefined,
      paymentTerms: data.paymentTerms || undefined,
      deliveryTerms: data.deliveryTerms || undefined,
      notes: data.notes || undefined,
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
  const { data: suppliers = [], error: suppliersError } = useGetSuppliersQuery();

  // Handle suppliers API errors with toast
  useEffect(() => {
    if (suppliersError) {
      const toastError = getToastErrorMessage(suppliersError);
      addToast({
        title: toastError.title,
        description: 'Failed to load suppliers. Some features may not work properly.',
        color: 'danger',
        variant: 'flat',
      });
    }
  }, [suppliersError]);

  // Use custom hooks (MUST be before any conditional returns)
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
    // Convert empty strings to undefined for optional fields
    const processedValue =
      ['prId', 'paymentTerms', 'deliveryTerms', 'notes'].includes(name) && value === ''
        ? undefined
        : value;

    setFormData((prev) => ({ ...prev, [name]: processedValue }));
    // Clear errors for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: [] }));
    }
  };

  // Create branch and supplier options
  const branchOptions = branches.map((branch) => ({
    value: branch.id,
    label: `${branch.code} - ${branch.name}`,
  }));

  // Create supplier options
  const supplierOptions = suppliers.map((supplier) => ({
    value: supplier.id,
    label: `${supplier.code} - ${supplier.name}`,
  }));

  return (
    <section className="max-w-6xl mx-auto p-6 space-y-6">
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
                  variant="bordered"
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
                isRequired
                variant="bordered"
                wasSubmitted={wasSubmitted}
                fieldSchema={purchaseOrderSchema.shape.supplierId}
                errors={errors.supplierId}
                options={supplierOptions}
                defaultSelectedKeys={formData.supplierId ? [formData.supplierId] : []}
                onValueChange={handleFieldChange}
              />
              <ValidatedSelect
                name="branchId"
                label="Branch"
                isRequired
                variant="bordered"
                wasSubmitted={wasSubmitted}
                fieldSchema={purchaseOrderSchema.shape.branchId}
                errors={errors.branchId}
                options={branchOptions}
                defaultSelectedKeys={formData.branchId ? [formData.branchId] : []}
                onValueChange={handleFieldChange}
              />{' '}
              <ValidatedDateInput
                name="expectedDeliveryDate"
                label="Expected Delivery Date"
                isRequired
                variant="bordered"
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
                variant="bordered"
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
                variant="bordered"
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
                  variant="bordered"
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
    </section>
  );
}
