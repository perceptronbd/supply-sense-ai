'use client';

import { ArrowLeftIcon } from '@/components/icons';
import { Text } from '@/components/ui/Text';
import { ValidatedInput } from '@/components/ui/ValidatedInput';
import {
  type CreateBranchFormData,
  branchFieldSchemas,
  createBranchSchema,
  updateBranchSchema,
} from '@/lib/schemas/branch.schema';
import {
  type Branch,
  useCreateBranchMutation,
  useUpdateBranchMutation,
} from '@/store/api/branchApi';
import { Button } from '@heroui/button';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Checkbox } from '@heroui/checkbox';
import { addToast } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface BranchFormProps {
  branch?: Branch;
  mode: 'create' | 'edit';
  onSuccess?: (branch: Branch) => void;
}

export function BranchForm({ branch, mode, onSuccess }: BranchFormProps) {
  const router = useRouter();
  const [createBranch, { isLoading: isCreating }] = useCreateBranchMutation();
  const [updateBranch, { isLoading: isUpdating }] = useUpdateBranchMutation();

  const isLoading = isCreating || isUpdating;
  const [formData, setFormData] = useState<CreateBranchFormData>({
    name: '',
    code: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    isActive: true,
  });

  const [wasSubmitted, setWasSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (branch && mode === 'edit') {
      setFormData({
        name: branch.name,
        code: branch.code,
        description: branch.description || '',
        address: branch.address || '',
        phone: branch.phone || '',
        email: branch.email || '',
        isActive: branch.isActive,
      });
    }
  }, [branch, mode]);
  const handleValueChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear field errors when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: [] }));
    }
  };

  const validateForm = (): boolean => {
    const schema = mode === 'create' ? createBranchSchema : updateBranchSchema;
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

  const createBranchAndShowToast = async (): Promise<Branch | undefined> => {
    const result = await createBranch(formData).unwrap();
    addToast({
      title: 'Success',
      description: 'Branch created successfully',
      color: 'success',
    });
    return result;
  };

  const updateBranchAndShowToast = async (): Promise<Branch | undefined> => {
    if (!branch?.id) return undefined;
    const result = await updateBranch({
      id: branch.id,
      data: formData,
    }).unwrap();
    addToast({
      title: 'Success',
      description: 'Branch updated successfully',
      color: 'success',
    });
    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWasSubmitted(true);

    if (!validateForm()) {
      addToast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        color: 'danger',
      });
      return;
    }

    try {
      let result: Branch | undefined;
      if (mode === 'create') {
        result = await createBranchAndShowToast();
      } else {
        result = await updateBranchAndShowToast();
      }

      if (result && onSuccess) {
        onSuccess(result);
      } else if (result) {
        router.push('/branches');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      addToast({
        title: 'Error',
        description: errorMessage,
        color: 'danger',
      });
    }
  };
  const handleCancel = () => {
    router.push('/branches');
  };

  return (
    <main className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
        {/* Header with back button */}
        <header className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Text variant="headerSmall" weight="bold" as="h1">
              {mode === 'create' ? 'Create New Branch' : 'Edit Branch'}
            </Text>
            <Button
              variant="light"
              onPress={handleCancel}
              startContent={<ArrowLeftIcon className="w-4 h-4" />}
              aria-label="Go back to branches list"
            >
              Back
            </Button>
          </div>
        </header>

        {/* Card 1: Basic Information */}
        <Card>
          <CardHeader>
            <Text variant="titleSmall" className="font-medium">
              Basic Information
            </Text>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ValidatedInput
                name="name"
                label="Branch Name"
                placeholder="Enter branch name"
                defaultValue={formData.name}
                fieldSchema={branchFieldSchemas.name}
                wasSubmitted={wasSubmitted}
                errors={fieldErrors.name}
                onValueChange={handleValueChange}
                variant="bordered"
                isRequired
              />
              <ValidatedInput
                name="code"
                label="Branch Code"
                placeholder="Enter branch code"
                defaultValue={formData.code}
                fieldSchema={branchFieldSchemas.code}
                wasSubmitted={wasSubmitted}
                errors={fieldErrors.code}
                onValueChange={handleValueChange}
                variant="bordered"
                isRequired
              />
            </div>
            <ValidatedInput
              name="description"
              label="Description"
              placeholder="Enter branch description (optional)"
              defaultValue={formData.description}
              fieldSchema={branchFieldSchemas.description}
              wasSubmitted={wasSubmitted}
              errors={fieldErrors.description}
              onValueChange={handleValueChange}
              variant="bordered"
            />
          </CardBody>
        </Card>

        {/* Card 2: Contact Information */}
        <Card>
          <CardHeader>
            <Text variant="titleSmall" className="font-medium">
              Contact Information
            </Text>
          </CardHeader>
          <CardBody className="space-y-4">
            <ValidatedInput
              name="address"
              label="Address"
              placeholder="Enter branch address (optional)"
              defaultValue={formData.address}
              fieldSchema={branchFieldSchemas.address}
              wasSubmitted={wasSubmitted}
              errors={fieldErrors.address}
              onValueChange={handleValueChange}
              variant="bordered"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ValidatedInput
                name="phone"
                label="Phone"
                placeholder="Enter phone number (optional)"
                defaultValue={formData.phone}
                fieldSchema={branchFieldSchemas.phone}
                wasSubmitted={wasSubmitted}
                errors={fieldErrors.phone}
                onValueChange={handleValueChange}
                variant="bordered"
              />
              <ValidatedInput
                name="email"
                label="Email"
                placeholder="Enter email address (optional)"
                defaultValue={formData.email}
                fieldSchema={branchFieldSchemas.email}
                wasSubmitted={wasSubmitted}
                errors={fieldErrors.email}
                onValueChange={handleValueChange}
                variant="bordered"
              />
            </div>
          </CardBody>
        </Card>

        {/* Card 3: Settings */}
        <Card>
          <CardHeader>
            <Text variant="titleSmall" className="font-medium">
              Settings
            </Text>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <Checkbox
                isSelected={formData.isActive}
                onValueChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked }))}
              >
                Active Branch
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
                ? 'Create Branch'
                : 'Update Branch'}
          </Button>
        </div>
      </form>
    </main>
  );
}
