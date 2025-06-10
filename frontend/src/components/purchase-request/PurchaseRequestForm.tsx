'use client';

import { Button, Card, CardBody, CardHeader } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  type PurchaseRequestActionState,
  type PurchaseRequestFormData,
  type PurchaseRequestItemFormData,
  purchaseRequestSchema,
} from '../../lib/schemas/purchase-request.schema';
import { useGetAllBranchesQuery } from '../../store/api/branchApi';
import {
  type PurchaseRequest,
  useCreatePurchaseRequestMutation,
  useGetPurchaseRequestTemplatesQuery,
  useUpdatePurchaseRequestMutation,
} from '../../store/api/purchaseRequestApi';
import type { RootState } from '../../store/store';
import { ValidatedInput } from '../ui/ValidatedInput';
import { ValidatedSelect } from '../ui/ValidatedSelect';
import { ValidatedTextarea } from '../ui/ValidatedTextarea';
import { PurchaseRequestItemForm } from './PurchaseRequestItemForm';

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
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  // API queries
  const { data: branches = [] } = useGetAllBranchesQuery(undefined);
  const { data: templates = [] } = useGetPurchaseRequestTemplatesQuery({
    branchId: formData.branchId,
  });

  // API mutations
  const [createPurchaseRequest, { isLoading: isCreating }] = useCreatePurchaseRequestMutation();
  const [updatePurchaseRequest, { isLoading: isUpdating }] = useUpdatePurchaseRequestMutation();

  // Helper function to clean form data for validation
  const processFormData = (data: Partial<PurchaseRequestFormData>) => {
    return {
      ...data,
      // Convert empty strings to undefined for optional UUID fields
      prTemplateId: data.prTemplateId === '' ? undefined : data.prTemplateId,
      description: data.description === '' ? undefined : data.description,
      justification: data.justification === '' ? undefined : data.justification,
      items:
        data.items?.map((item) => ({
          ...item,
          requestedQty: Number(item.requestedQty),
          estimatedPrice: item.estimatedPrice ? Number(item.estimatedPrice) : undefined,
          remarks: item.remarks === '' ? undefined : item.remarks,
        })) || [],
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('handleSubmit called');
    e.preventDefault();
    setWasSubmitted(true);

    const processedFormData = processFormData(formData);

    const validation = purchaseRequestSchema.safeParse(processedFormData);
    console.log('Validation result:', validation);
    console.log('Form data being validated:', processedFormData);

    if (!validation.success) {
      console.log('Validation failed:', validation.error);
      const fieldErrors = validation.error.flatten().fieldErrors;
      setErrors(fieldErrors);
      return;
    }
    try {
      if (mode === 'create') {
        console.log('Attempting to create purchase request:', validation.data);
        const result = await createPurchaseRequest(validation.data).unwrap();
        console.log('Purchase request created successfully:', result);
        onSuccess?.(result);
        router.push('/purchase-requests');
      } else if (mode === 'edit' && id) {
        console.log('Attempting to update purchase request:', validation.data);
        const result = await updatePurchaseRequest({
          id,
          data: validation.data,
        }).unwrap();
        console.log('Purchase request updated successfully:', result);
        onSuccess?.(result);
        router.push('/purchase-requests');
      }
    } catch (error: unknown) {
      console.error('Error saving purchase request:', error);
      const errorMessage =
        error &&
        typeof error === 'object' &&
        'data' in error &&
        error.data &&
        typeof error.data === 'object' &&
        'message' in error.data &&
        typeof error.data.message === 'string'
          ? error.data.message
          : 'An error occurred while saving the purchase request.';

      setErrors({
        _form: [errorMessage],
      });
    }
  };
  const handleFieldChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear errors for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: [] }));
    }
  };

  const handleAddItem = (item: PurchaseRequestItemFormData) => {
    const currentItems = formData.items || [];
    if (editingItemIndex !== null) {
      // Update existing item
      const updatedItems = [...currentItems];
      updatedItems[editingItemIndex] = item;
      setFormData((prev) => ({ ...prev, items: updatedItems }));
      setEditingItemIndex(null);
    } else {
      // Add new item
      setFormData((prev) => ({ ...prev, items: [...currentItems, item] }));
    }
    setShowItemForm(false);

    // Clear items error if it exists
    if (errors.items) {
      setErrors((prev) => ({ ...prev, items: [] }));
    }
  };

  const handleEditItem = (index: number) => {
    setEditingItemIndex(index);
    setShowItemForm(true);
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = formData.items?.filter((_, i) => i !== index) || [];
    setFormData((prev) => ({ ...prev, items: updatedItems }));
  };

  const handleLoadTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      const templateItems = template.items.map((item) => ({
        itemId: item.itemId,
        requestedQty: item.defaultQty,
        estimatedPrice: item.item.currentPrice,
        requiredDate: formData.requiredDate || new Date().toISOString().split('T')[0],
        remarks: '',
      }));
      setFormData((prev) => ({ ...prev, items: templateItems }));
    }
  };

  const calculateTotalAmount = () => {
    return (
      formData.items?.reduce((total, item) => {
        const price = Number(item.estimatedPrice) || 0;
        const qty = Number(item.requestedQty) || 0;
        return total + price * qty;
      }, 0) || 0
    );
  };

  const branchOptions = branches.map((branch) => ({
    value: branch.id,
    label: `${branch.code} - ${branch.name}`,
  }));

  const templateOptions = templates.map((template) => ({
    value: template.id,
    label: template.name,
  }));

  // Set default required date to today if not set
  const defaultRequiredDate = formData.requiredDate || new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {mode === 'create' ? 'Create Purchase Request' : 'Edit Purchase Request'}
          </h1>
          <p className="text-gray-600 mt-2">
            {mode === 'create'
              ? 'Create a new purchase request for your branch'
              : 'Update the purchase request details'}
          </p>
        </div>
      </div>{' '}
      {errors._form && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">
            {errors._form.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        </div>
      )}
      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <h3 className="text-xl font-semibold">Basic Information</h3>
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
                required
                wasSubmitted={wasSubmitted}
                fieldSchema={purchaseRequestSchema.shape.branchId}
                errors={errors.branchId}
                options={branchOptions}
                defaultValue={formData.branchId}
                onValueChange={handleFieldChange}
              />
              <ValidatedInput
                name="requiredDate"
                type="date"
                label="Required Date"
                required
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
        {templateOptions.length > 0 && (
          <Card>
            <CardHeader>
              <h3 className="text-xl font-semibold">Templates</h3>
            </CardHeader>
            <CardBody>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  {' '}
                  <ValidatedSelect
                    name="templateId"
                    label="Load from Template"
                    wasSubmitted={false}
                    fieldSchema={purchaseRequestSchema.shape.prTemplateId}
                    options={templateOptions}
                    placeholder="Select a template to load items"
                    onValueChange={(_, value) => {
                      if (value) {
                        handleLoadTemplate(value);
                      }
                    }}
                  />
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Items Section */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Items</h3>
              <Button
                type="button"
                color="primary"
                variant="flat"
                onPress={() => {
                  setEditingItemIndex(null);
                  setShowItemForm(true);
                }}
              >
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            {' '}
            {errors.items && (
              <div className="mb-4 text-red-600 text-sm">
                {errors.items.map((error) => (
                  <p key={error}>{error}</p>
                ))}
              </div>
            )}
            {showItemForm && (
              <div className="mb-6">
                <PurchaseRequestItemForm
                  item={editingItemIndex !== null ? formData.items?.[editingItemIndex] : undefined}
                  onSave={handleAddItem}
                  onCancel={() => {
                    setShowItemForm(false);
                    setEditingItemIndex(null);
                  }}
                  wasSubmitted={wasSubmitted}
                  branchId={formData.branchId}
                />
              </div>
            )}
            {formData.items && formData.items.length > 0 ? (
              <div className="space-y-4">
                {' '}
                {formData.items.map((item, index) => (
                  <div
                    key={`${item.itemId}-${index}`}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Item ID</p>
                          <p className="font-medium">{item.itemId}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Quantity</p>
                          <p className="font-medium">{item.requestedQty}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Est. Price</p>
                          <p className="font-medium">
                            {item.estimatedPrice
                              ? `$${Number(item.estimatedPrice).toFixed(2)}`
                              : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Required Date</p>
                          <p className="font-medium">{item.requiredDate}</p>
                        </div>
                        {item.remarks && (
                          <div className="md:col-span-4">
                            <p className="text-sm text-gray-600">Remarks</p>
                            <p className="font-medium">{item.remarks}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          type="button"
                          size="sm"
                          variant="flat"
                          color="primary"
                          onPress={() => handleEditItem(index)}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="flat"
                          color="danger"
                          onPress={() => handleRemoveItem(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {/* Total Amount */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="text-right">
                    <p className="text-lg font-semibold">
                      Total Estimated Amount: ${calculateTotalAmount().toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No items added yet. Click "Add Item" to get started.</p>
              </div>
            )}
          </CardBody>
        </Card>

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
    </div>
  );
}
