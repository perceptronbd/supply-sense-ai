'use client';

import { Text } from '@/components/ui/Text';
import { ValidatedDateInput } from '@/components/ui/ValidatedDateInput';
import { ValidatedInput } from '@/components/ui/ValidatedInput';
import { ValidatedSelect } from '@/components/ui/ValidatedSelect';
import { ValidatedTextarea } from '@/components/ui/ValidatedTextarea';
import {
  type CreateGoodsReceiptFormData,
  createGoodsReceiptSchema,
} from '@/lib/schemas/goods-receipt.schema';
import { useGetAllBranchesQuery } from '@/store/api/branchApi';
import {
  type GoodsReceipt,
  useCreateGoodsReceiptMutation,
  useUpdateGoodsReceiptMutation,
} from '@/store/api/goodsReceiptApi';
import type { RootState } from '@/store/store';
import { Button, Card, CardBody, CardHeader } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { ItemsSection } from './ItemsSection';
import { useFormSubmission, useItemManagement } from './hooks';

interface GoodsReceiptFormProps {
  id?: string; // Goods Receipt ID for editing
  initialData?: Partial<CreateGoodsReceiptFormData>;
  mode?: 'create' | 'edit';
  onSuccess?: (goodsReceipt: GoodsReceipt) => void;
  sourceType?: 'po' | 'mr' | 'manual';
  sourceId?: string; // PO ID or MR ID
}

export function GoodsReceiptForm({
  id,
  initialData,
  mode = 'create',
  onSuccess,
  sourceType = 'manual',
  sourceId,
}: GoodsReceiptFormProps) {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);

  // Helper function to normalize initial data
  const createDefaultData = (receiptDate: string) => ({
    receiptDate,
    documentNumber: '',
    branchId: user?.branchId || '',
    remarks: '',
    items: [],
  });

  const addSourceFields = (
    data: CreateGoodsReceiptFormData,
    sourceType: string,
    sourceId?: string
  ) => {
    if (sourceType === 'po' && sourceId) {
      return { ...data, poId: sourceId };
    }
    if (sourceType === 'mr' && sourceId) {
      return { ...data, mrId: sourceId };
    }
    return data;
  };

  const normalizeInitialData = (data?: Partial<CreateGoodsReceiptFormData>) => {
    const defaultReceiptDate = new Date().toISOString().split('T')[0];

    if (!data) {
      const defaultData = createDefaultData(defaultReceiptDate);
      return addSourceFields(defaultData, sourceType, sourceId);
    }

    const normalizedData = {
      receiptDate: data.receiptDate || defaultReceiptDate,
      documentNumber: data.documentNumber || '',
      branchId: data.branchId || user?.branchId || '',
      remarks: data.remarks || '',
      items: data.items || [],
      ...(data.poId ? { poId: data.poId } : {}),
      ...(data.mrId ? { mrId: data.mrId } : {}),
    };

    return normalizedData;
  };

  const [formData, setFormData] = useState<CreateGoodsReceiptFormData>(
    normalizeInitialData(initialData)
  );
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [wasSubmitted, setWasSubmitted] = useState(false);

  // API hooks
  const [createGoodsReceipt] = useCreateGoodsReceiptMutation();
  const [updateGoodsReceipt] = useUpdateGoodsReceiptMutation(); // Data fetching hooks
  const { data: branches = [] } = useGetAllBranchesQuery(undefined);

  // Form submission hook
  const { isSubmitting, handleSubmit } = useFormSubmission<
    CreateGoodsReceiptFormData,
    GoodsReceipt
  >({
    schema: createGoodsReceiptSchema,
    formData,
    createMutation: createGoodsReceipt,
    updateMutation: mode === 'edit' ? updateGoodsReceipt : undefined,
    id,
    onSuccess,
    router,
    redirectPath: '/goods-receipts',
  });
  // Item management hooks
  const {
    showItemForm,
    setShowItemForm,
    editingItemIndex,
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

  // Transform branches for select component
  const branchOptions = branches.map((branch) => ({
    value: branch.id,
    label: branch.name,
  }));

  // Helper functions
  const handleFieldChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear errors for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: [] }));
    }
  };

  const getSourceTitle = () => {
    switch (sourceType) {
      case 'po':
        return 'Create Goods Receipt from Purchase Order';
      case 'mr':
        return 'Create Goods Receipt from Material Requisition';
      default:
        return 'Create Goods Receipt';
    }
  };

  const getSourceDescription = () => {
    switch (sourceType) {
      case 'po':
        return 'Record the receipt of goods from a purchase order';
      case 'mr':
        return 'Record the receipt of goods from a material requisition';
      default:
        return 'Manually record the receipt of goods';
    }
  };

  return (
    <section className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <Text variant="headerSmall" weight="bold" as="h1">
            {mode === 'create' ? getSourceTitle() : 'Edit Goods Receipt'}
          </Text>
          <Text variant="bodyBase" className="text-default-500 mt-2" as="p">
            {mode === 'create' ? getSourceDescription() : 'Update the goods receipt details'}
          </Text>
        </div>
      </header>

      {errors._form && (
        <section className="bg-danger-50 border border-danger-200 rounded-md p-4">
          <div className="text-danger-800">
            {errors._form.map((error) => (
              <Text variant="bodyBase" key={error} as="p">
                {error}
              </Text>
            ))}
          </div>
        </section>
      )}

      <form className="space-y-6" onSubmit={(e) => handleSubmit(e, setErrors, setWasSubmitted)}>
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <Text variant="titleLarge" weight="semiBold" as="h2">
              Basic Information
            </Text>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ValidatedDateInput
                name="receiptDate"
                label="Receipt Date"
                isRequired
                wasSubmitted={wasSubmitted}
                fieldSchema={createGoodsReceiptSchema.shape.receiptDate}
                errors={errors.receiptDate}
                defaultValue={formData.receiptDate}
                onValueChange={handleFieldChange}
              />
              <ValidatedInput
                name="documentNumber"
                type="text"
                label="Document Number"
                wasSubmitted={wasSubmitted}
                fieldSchema={createGoodsReceiptSchema.shape.documentNumber}
                errors={errors.documentNumber}
                defaultValue={formData.documentNumber}
                placeholder="Enter document reference number"
                onValueChange={handleFieldChange}
              />
              <ValidatedSelect
                name="branchId"
                label="Branch"
                isRequired
                wasSubmitted={wasSubmitted}
                fieldSchema={createGoodsReceiptSchema.shape.branchId}
                errors={errors.branchId}
                options={branchOptions}
                defaultSelectedKeys={formData.branchId ? [formData.branchId] : []}
                onValueChange={handleFieldChange}
              />
              <div className="md:col-span-2">
                <ValidatedTextarea
                  name="remarks"
                  label="Remarks"
                  wasSubmitted={wasSubmitted}
                  fieldSchema={createGoodsReceiptSchema.shape.remarks}
                  errors={errors.remarks}
                  defaultValue={formData.remarks}
                  placeholder="Enter any additional remarks or notes"
                  onValueChange={handleFieldChange}
                />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Items Section */}
        <ItemsSection
          items={formData.items}
          showItemForm={showItemForm}
          setShowItemForm={setShowItemForm}
          editingItemIndex={editingItemIndex}
          onAddItem={handleAddItem}
          onEditItem={handleEditItem}
          onRemoveItem={handleRemoveItem}
          errors={errors}
          wasSubmitted={wasSubmitted}
          calculateTotalAmount={calculateTotalAmount}
        />

        {/* Form Actions */}
        <section className="flex justify-end gap-4">
          <Button variant="light" onPress={() => router.back()} isDisabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" color="primary" isLoading={isSubmitting} isDisabled={isSubmitting}>
            {mode === 'create' ? 'Create Goods Receipt' : 'Update Goods Receipt'}
          </Button>
        </section>
      </form>
    </section>
  );
}
