'use client';

import {
  type PurchaseRequestActionState,
  type PurchaseRequestFormData,
  type PurchaseRequestItemFormData,
  purchaseRequestSchema,
} from '@/lib/schemas/purchase-request.schema';
import { useGetAllBranchesQuery } from '@/store/api/branchApi';
import {
  type PurchaseRequest,
  useGetPurchaseRequestTemplatesQuery,
} from '@/store/api/purchaseRequestApi';
import type { RootState } from '@/store/store';
import { Button, Card, CardBody, CardHeader } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Text } from '../ui/Text';
import { ValidatedDateInput } from '../ui/ValidatedDateInput';
import { ValidatedInput } from '../ui/ValidatedInput';
import { ValidatedSelect } from '../ui/ValidatedSelect';
import { ValidatedTextarea } from '../ui/ValidatedTextarea';
import { ItemsSection } from './ItemsSection';
import { TemplateSelection } from './TemplateSelection';
import { useAiRecommendations, useFormSubmission, useItemManagement } from './hooks';

interface PurchaseRequestFormProps {
  id?: string; // Purchase Request ID for editing
  initialData?: Partial<PurchaseRequestFormData>;
  mode?: 'create' | 'edit';
  onSuccess?: (purchaseRequest: PurchaseRequest) => void;
}

export function PurchaseRequestForm({
  id,
  initialData,
  mode = 'create',
  onSuccess,
}: PurchaseRequestFormProps) {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);

  // Helper function to normalize initial data
  const normalizeInitialData = (data?: Partial<PurchaseRequestFormData>) => {
    if (!data) {
      return {
        title: '',
        description: '',
        requiredDate: '',
        branchId: user?.branchId || '',
        prTemplateId: '',
        justification: '',
        items: [],
      };
    }

    return {
      ...data,
      items:
        data.items?.map((item) => ({
          ...item,
          requestedQty: Number(item.requestedQty) || 0,
          estimatedPrice: item.estimatedPrice ? Number(item.estimatedPrice) : undefined,
        })) || [],
    };
  };

  const [formData, setFormData] = useState<Partial<PurchaseRequestFormData>>(
    normalizeInitialData(initialData)
  );

  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [wasSubmitted, setWasSubmitted] = useState(false);

  // API queries
  const { data: branches = [] } = useGetAllBranchesQuery(undefined);
  const { data: templates = [] } = useGetPurchaseRequestTemplatesQuery({
    branchId: formData.branchId,
  });

  // Create branch and template options
  const branchOptions = branches.map((branch) => ({
    value: branch.id,
    label: `${branch.code} - ${branch.name}`,
  }));

  const templateOptions = templates.map((template) => ({
    value: template.id,
    label: template.name,
  }));

  // Use custom hooks
  const { handleSubmit, isCreating, isUpdating } = useFormSubmission({
    mode,
    id,
    formData,
    onSuccess,
  });

  const { handleGenerateRecommendations, isGeneratingRecommendations } = useAiRecommendations({
    formData,
    branchOptions,
    setFormData,
    setErrors,
    errors,
  });

  const {
    showItemForm,
    setShowItemForm,
    editingItemIndex,
    setEditingItemIndex,
    handleAddItem,
    handleEditItem,
    handleRemoveItem,
    handleLoadTemplate,
    calculateTotalAmount,
  } = useItemManagement({
    formData,
    setFormData,
    errors,
    setErrors,
    templates,
  });

  // Helper functions
  const handleFieldChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear errors for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: [] }));
    }
  };

  // Set default required date to today if not set
  const defaultRequiredDate = formData.requiredDate || new Date().toISOString().split('T')[0];

  return (
    <section className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <Text variant="headerSmall" weight="bold" as="h1">
            {mode === 'create' ? 'Create Purchase Request' : 'Edit Purchase Request'}
          </Text>
          <Text variant="bodyBase" className="text-default-500 mt-2" as="p">
            {mode === 'create'
              ? 'Create a new purchase request for your branch'
              : 'Update the purchase request details'}
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
              <div className="md:col-span-2">
                {' '}
                <ValidatedInput
                  name="title"
                  type="text"
                  label="Title"
                  required
                  wasSubmitted={wasSubmitted}
                  fieldSchema={purchaseRequestSchema.shape.title}
                  errors={errors.title}
                  defaultValue={formData.title}
                  placeholder="Enter a descriptive title for this purchase request"
                  onValueChange={handleFieldChange}
                />
              </div>{' '}
              <ValidatedSelect
                name="branchId"
                label="Branch"
                isRequired
                wasSubmitted={wasSubmitted}
                fieldSchema={purchaseRequestSchema.shape.branchId}
                errors={errors.branchId}
                options={branchOptions}
                defaultSelectedKeys={formData.branchId ? [formData.branchId] : []}
                onValueChange={handleFieldChange}
              />
              <ValidatedDateInput
                name="requiredDate"
                label="Required Date"
                isRequired
                wasSubmitted={wasSubmitted}
                fieldSchema={purchaseRequestSchema.shape.requiredDate}
                errors={errors.requiredDate}
                defaultValue={defaultRequiredDate}
                onValueChange={handleFieldChange}
              />
              <div className="md:col-span-2">
                {' '}
                <ValidatedTextarea
                  name="description"
                  label="Description"
                  wasSubmitted={wasSubmitted}
                  fieldSchema={purchaseRequestSchema.shape.description}
                  errors={errors.description}
                  defaultValue={formData.description}
                  rows={3}
                  placeholder="Provide additional details about this purchase request"
                  onValueChange={handleFieldChange}
                />
              </div>
              <div className="md:col-span-2">
                {' '}
                <ValidatedTextarea
                  name="justification"
                  label="Justification"
                  wasSubmitted={wasSubmitted}
                  fieldSchema={purchaseRequestSchema.shape.justification}
                  errors={errors.justification}
                  defaultValue={formData.justification}
                  rows={3}
                  placeholder="Explain why this purchase is necessary"
                  onValueChange={handleFieldChange}
                />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Template Selection */}
        <TemplateSelection templateOptions={templateOptions} onLoadTemplate={handleLoadTemplate} />

        {/* Items Section */}
        <ItemsSection
          formData={formData}
          errors={errors}
          wasSubmitted={wasSubmitted}
          showItemForm={showItemForm}
          editingItemIndex={editingItemIndex}
          isGeneratingRecommendations={isGeneratingRecommendations}
          calculateTotalAmount={calculateTotalAmount}
          handleGenerateRecommendations={handleGenerateRecommendations}
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
            {mode === 'create' ? 'Create Purchase Request' : 'Update Purchase Request'}
          </Button>
        </div>
      </form>
    </section>
  );
}
