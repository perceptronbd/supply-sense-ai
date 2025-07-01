'use client';

import { Text } from '@/components/ui/Text';
import { ValidatedInput } from '@/components/ui/ValidatedInput';
import {
  type CreateSupplierFormData,
  createSupplierSchema,
  supplierFieldSchemas,
  updateSupplierSchema,
} from '@/lib/schemas/supplier.schema';
import {
  type Supplier,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
} from '@/store/api/supplierApi';
import { Button } from '@heroui/button';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Checkbox } from '@heroui/checkbox';
import { addToast } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface SupplierFormProps {
  supplier?: Supplier;
  onSuccess?: (supplier: Supplier) => void;
}

export function SupplierForm({ supplier, onSuccess }: SupplierFormProps) {
  const router = useRouter();
  const [createSupplier, { isLoading: isCreating }] = useCreateSupplierMutation();
  const [updateSupplier, { isLoading: isUpdating }] = useUpdateSupplierMutation();

  const mode = supplier ? 'edit' : 'create';
  const isLoading = isCreating || isUpdating;

  const [formData, setFormData] = useState<CreateSupplierFormData>({
    name: '',
    code: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    isActive: true,
  });

  const [wasSubmitted, setWasSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (supplier && mode === 'edit') {
      setFormData({
        name: supplier.name,
        code: supplier.code,
        contactPerson: supplier.contactPerson || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        isActive: supplier.isActive,
      });
    }
  }, [supplier, mode]);

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
    const schema = mode === 'create' ? createSupplierSchema : updateSupplierSchema;
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

  const createSupplierAndShowToast = async (): Promise<Supplier | undefined> => {
    const result = await createSupplier(formData).unwrap();
    addToast({
      title: 'Success',
      description: 'Supplier created successfully',
      color: 'success',
    });
    return result;
  };

  const updateSupplierAndShowToast = async (): Promise<Supplier | undefined> => {
    if (!supplier?.id) return undefined;
    const result = await updateSupplier({
      id: supplier.id,
      supplierData: formData,
    }).unwrap();
    addToast({
      title: 'Success',
      description: 'Supplier updated successfully',
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
      let result: Supplier | undefined;
      if (mode === 'create') {
        result = await createSupplierAndShowToast();
      } else {
        result = await updateSupplierAndShowToast();
      }

      if (result && onSuccess) {
        onSuccess(result);
      } else if (result) {
        router.push('/suppliers');
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
    if (supplier) {
      router.push(`/suppliers/${supplier.id}`);
    } else {
      router.push('/suppliers');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Card 1: Basic Information */}
      <Card as="article">
        <CardHeader>
          <Text variant="titleSmall" className="font-medium" as="h3">
            Basic Information
          </Text>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ValidatedInput
              name="name"
              label="Supplier Name"
              placeholder="Enter supplier name"
              defaultValue={formData.name}
              fieldSchema={supplierFieldSchemas.name}
              wasSubmitted={wasSubmitted}
              errors={fieldErrors.name}
              onValueChange={handleValueChange}
              variant="bordered"
              isRequired
            />
            <ValidatedInput
              name="code"
              label="Supplier Code"
              placeholder="Enter supplier code"
              defaultValue={formData.code}
              fieldSchema={supplierFieldSchemas.code}
              wasSubmitted={wasSubmitted}
              errors={fieldErrors.code}
              onValueChange={handleValueChange}
              variant="bordered"
              isRequired
            />
          </div>
          <ValidatedInput
            name="contactPerson"
            label="Contact Person"
            placeholder="Enter contact person name (optional)"
            defaultValue={formData.contactPerson}
            fieldSchema={supplierFieldSchemas.contactPerson}
            wasSubmitted={wasSubmitted}
            errors={fieldErrors.contactPerson}
            onValueChange={handleValueChange}
            variant="bordered"
          />
        </CardBody>
      </Card>

      {/* Card 2: Contact Information */}
      <Card as="article">
        <CardHeader>
          <Text variant="titleSmall" className="font-medium" as="h3">
            Contact Information
          </Text>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ValidatedInput
              name="email"
              label="Email"
              placeholder="Enter email address (optional)"
              defaultValue={formData.email}
              fieldSchema={supplierFieldSchemas.email}
              wasSubmitted={wasSubmitted}
              errors={fieldErrors.email}
              onValueChange={handleValueChange}
              variant="bordered"
            />
            <ValidatedInput
              name="phone"
              label="Phone"
              placeholder="Enter phone number (optional)"
              defaultValue={formData.phone}
              fieldSchema={supplierFieldSchemas.phone}
              wasSubmitted={wasSubmitted}
              errors={fieldErrors.phone}
              onValueChange={handleValueChange}
              variant="bordered"
            />
          </div>
          <ValidatedInput
            name="address"
            label="Address"
            placeholder="Enter supplier address (optional)"
            defaultValue={formData.address}
            fieldSchema={supplierFieldSchemas.address}
            wasSubmitted={wasSubmitted}
            errors={fieldErrors.address}
            onValueChange={handleValueChange}
            variant="bordered"
          />
        </CardBody>
      </Card>

      {/* Card 3: Settings */}
      <Card as="article">
        <CardHeader>
          <Text variant="titleSmall" className="font-medium" as="h3">
            Settings
          </Text>
        </CardHeader>
        <CardBody className="space-y-4">
          <div>
            <Checkbox
              isSelected={formData.isActive}
              onValueChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked }))}
            >
              Active Supplier
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
              ? 'Create Supplier'
              : 'Update Supplier'}
        </Button>
      </div>
    </form>
  );
}
