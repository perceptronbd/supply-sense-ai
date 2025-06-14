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
import { Button, Card, CardBody, CardHeader, addToast } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { useSelector } from 'react-redux';

interface GoodsReceiptFormProps {
  id?: string;
  initialData?: Partial<CreateGoodsReceiptFormData>;
  mode?: 'create' | 'edit';
  onSuccess?: (goodsReceipt: GoodsReceipt) => void;
  sourceType?: 'po' | 'mr' | 'manual';
  sourceId?: string;
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

  const [formData, setFormData] = useState<CreateGoodsReceiptFormData>({
    receiptDate: initialData?.receiptDate || new Date().toISOString().split('T')[0],
    documentNumber: initialData?.documentNumber || '',
    branchId: initialData?.branchId || user?.branchId || '',
    remarks: initialData?.remarks || '',
    items: initialData?.items || [],
    ...(sourceType === 'po' && sourceId ? { poId: sourceId } : {}),
    ...(sourceType === 'mr' && sourceId ? { mrId: sourceId } : {}),
  });

  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [wasSubmitted, setWasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // API hooks
  const [createGoodsReceipt] = useCreateGoodsReceiptMutation();
  const [updateGoodsReceipt] = useUpdateGoodsReceiptMutation();
  const { data: branches = [] } = useGetAllBranchesQuery(undefined);

  const branchOptions = branches.map((branch) => ({
    value: branch.id,
    label: branch.name,
  }));

  const handleFieldChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: [] }));
    }
  };

  const handleValidationErrors = (error: unknown) => {
    const err = error as {
      data?: { errors?: Record<string, string[]> };
      issues?: Array<{ path: string[]; message: string }>;
      message?: string;
    };

    if (err?.data?.errors) {
      setErrors(err.data.errors);
    } else if (err?.issues) {
      const validationErrors: Record<string, string[]> = {};
      for (const issue of err.issues) {
        const path = issue.path.join('.');
        if (!validationErrors[path]) {
          validationErrors[path] = [];
        }
        validationErrors[path].push(issue.message);
      }
      setErrors(validationErrors);
    } else {
      setErrors({
        _form: [err?.message || 'An unexpected error occurred'],
      });
    }
  };

  const executeFormAction = async (
    validatedData: CreateGoodsReceiptFormData
  ): Promise<GoodsReceipt> => {
    if (id && mode === 'edit') {
      const result = await updateGoodsReceipt({ id, data: validatedData }).unwrap();
      addToast({
        title: 'Success',
        description: 'Goods receipt updated successfully',
        color: 'success',
        variant: 'flat',
      });
      return result;
    }

    const result = await createGoodsReceipt(validatedData).unwrap();
    addToast({
      title: 'Success',
      description: 'Goods receipt created successfully',
      color: 'success',
      variant: 'flat',
    });
    return result;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setWasSubmitted(true);
    setIsSubmitting(true);

    try {
      const validatedData = createGoodsReceiptSchema.parse(formData);
      const result = await executeFormAction(validatedData);

      if (onSuccess) {
        onSuccess(result);
      } else {
        router.push('/goods-receipts');
      }
    } catch (error: unknown) {
      handleValidationErrors(error);

      addToast({
        title: 'Error',
        description: 'Failed to save goods receipt. Please check the form for errors.',
        color: 'danger',
        variant: 'flat',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    if (mode === 'edit') return 'Edit Goods Receipt';
    switch (sourceType) {
      case 'po':
        return 'Create Goods Receipt from Purchase Order';
      case 'mr':
        return 'Create Goods Receipt from Material Requisition';
      default:
        return 'Create Goods Receipt';
    }
  };

  const getDescription = () => {
    if (mode === 'edit') return 'Update the goods receipt details';
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
            {getTitle()}
          </Text>
          <Text variant="bodyBase" className="text-default-500 mt-2" as="p">
            {getDescription()}
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

      <form className="space-y-6" onSubmit={handleSubmit}>
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

        {/* Placeholder for Items - to be implemented later */}
        <Card>
          <CardHeader>
            <Text variant="titleLarge" weight="semiBold" as="h2">
              Items
            </Text>
          </CardHeader>
          <CardBody>
            <div className="text-center py-8 text-default-500">
              <Text variant="bodyBase" as="p">
                Item management will be implemented in a future update. For now, you can create the
                basic goods receipt structure.
              </Text>
            </div>
          </CardBody>
        </Card>

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
