'use client';

import { ArrowLeftIcon } from '@/components/icons';
import { Text } from '@/components/ui/Text';
import { ValidatedInput } from '@/components/ui/ValidatedInput';
import { ROUTE_PATHS } from '@/config/routes';
import { type CreateUserFormData } from '@/lib/schemas/user.schema';
import { useGetBranchesQuery } from '@/store/api/branchApi';
import { useGetRolesQuery } from '@/store/api/roleApi';
import {
  type UpdateUserRequest,
  type User,
  useAssignBranchesMutation,
  useAssignRolesMutation,
  useCreateUserMutation,
  useUpdateUserMutation,
} from '@/store/api/userApi';
import { Button } from '@heroui/button';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Checkbox } from '@heroui/checkbox';
import { Chip } from '@heroui/chip';
import { addToast } from '@heroui/react';
import { Select, SelectItem } from '@heroui/select';
import { TriangleAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { z } from 'zod';

// Helper function to compare arrays
const arraysEqual = (a: string[], b: string[]): boolean => {
  if (a.length !== b.length) return false;
  return a.every((val, i) => val === b[i]);
};

interface UserFormProps {
  user?: User;
  mode: 'create' | 'edit';
  onSuccess?: (user: User) => void;
}

export function UserForm({ user, mode, onSuccess }: UserFormProps) {
  const router = useRouter();
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [assignRoles, { isLoading: isAssigningRoles }] = useAssignRolesMutation();
  const [assignBranches, { isLoading: isAssigningBranches }] = useAssignBranchesMutation();

  // Fetch roles and branches for the form
  const { data: roles = [] } = useGetRolesQuery();
  const { data: branchesResponse } = useGetBranchesQuery({});
  const branches = Array.isArray(branchesResponse?.data) ? branchesResponse.data : [];

  const isLoading = isCreating || isUpdating || isAssigningRoles || isAssigningBranches;
  const [formData, setFormData] = useState<CreateUserFormData>({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    roleIds: [],
    branchIds: [],
    isActive: true,
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [wasSubmitted, setWasSubmitted] = useState(false);

  // Define individual field schemas for ValidatedInput
  const fieldSchemas = {
    firstName: z
      .string()
      .min(1, 'First name is required')
      .max(50, 'First name must be less than 50 characters')
      .regex(/^[a-zA-Z\s]+$/, 'First name can only contain letters and spaces'),
    lastName: z
      .string()
      .min(1, 'Last name is required')
      .max(50, 'Last name must be less than 50 characters')
      .regex(/^[a-zA-Z\s]+$/, 'Last name can only contain letters and spaces'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Invalid email format')
      .max(255, 'Email must be less than 255 characters'),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must be less than 30 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must be less than 128 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/,
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  };

  // Custom validation function for password confirmation
  const getConfirmPasswordSchema = (password: string) => {
    return z
      .string()
      .min(1, 'Please confirm your password')
      .refine((value) => value === password, 'Passwords do not match');
  };

  useEffect(() => {
    if (user && mode === 'edit') {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        username: user.username,
        password: '', // Don't pre-fill password for security
        confirmPassword: '',
        roleIds: user.roles?.map((role) => role.id) || [],
        branchIds: user.branches?.map((branch) => branch.id) || [],
        isActive: user.isActive,
      });
    }
  }, [user, mode]);

  const handleValueChange = (name: string, value: string | boolean | string[]) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear field errors when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: [] }));
    }
  };

  const handleValidatedInputChange = (name: string, value: string) => {
    handleValueChange(name, value);
  };

  const validateCreateMode = (errors: Record<string, string[]>) => {
    // Validate roles
    if (!formData.roleIds || formData.roleIds.length === 0) {
      errors.roleIds = ['At least one role must be selected'];
    }

    // Validate branches
    if (!formData.branchIds || formData.branchIds.length === 0) {
      errors.branchIds = ['At least one branch must be selected'];
    }

    // Validate password confirmation
    if (!formData.password || formData.password.length < 8) {
      errors.password = ['Password must be at least 8 characters'];
    }
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = ['Passwords do not match'];
    }
  };

  const validateEditMode = (errors: Record<string, string[]>) => {
    // For edit mode, if password is provided, validate it and confirmation
    if (formData.password && formData.password.length > 0) {
      if (formData.password.length < 8) {
        errors.password = ['Password must be at least 8 characters'];
      }
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = ['Passwords do not match'];
      }
    }
  };

  const validateForm = (): boolean => {
    // Since we're using ValidatedInput components, we only need to validate
    // the roles and branches which are not handled by ValidatedInput
    const errors: Record<string, string[]> = {};

    if (mode === 'create') {
      validateCreateMode(errors);
    } else if (mode === 'edit') {
      validateEditMode(errors);
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const createUserAndShowToast = async (): Promise<User | undefined> => {
    const result = await createUser(formData).unwrap();
    addToast({
      title: 'Success',
      description: 'User created successfully',
      color: 'success',
    });
    return result;
  };

  const updateUserAndShowToast = async (): Promise<User | undefined> => {
    if (!user) return;

    try {
      // 1. Update basic user information
      const updateData: UpdateUserRequest = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        username: formData.username,
        isActive: formData.isActive,
      };

      // Only include password if it's provided and not empty
      if (formData.password && formData.password.trim().length > 0) {
        updateData.password = formData.password;
      }

      let result = await updateUser({
        id: user.id,
        userData: updateData,
      }).unwrap();

      // 2. Update roles if they have changed
      const currentRoleIds = user.roles?.map((role) => role.id) || [];
      const newRoleIds = formData.roleIds;

      if (!arraysEqual(currentRoleIds.sort(), newRoleIds.sort())) {
        result = await assignRoles({
          id: user.id,
          rolesData: {
            roleIds: newRoleIds,
            operation: 'replace',
          },
        }).unwrap();
      }

      // 3. Update branches if they have changed
      const currentBranchIds = user.branches?.map((branch) => branch.id) || [];
      const newBranchIds = formData.branchIds;

      if (!arraysEqual(currentBranchIds.sort(), newBranchIds.sort())) {
        result = await assignBranches({
          id: user.id,
          branchesData: {
            branchIds: newBranchIds,
            operation: 'replace',
          },
        }).unwrap();
      }

      addToast({
        title: 'Success',
        description: 'User updated successfully',
        color: 'success',
      });
      return result;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error; // Re-throw to be handled by the calling function
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
    setWasSubmitted(true);

    if (!validateForm()) {
      console.log('Form validation failed:', fieldErrors);
      return;
    }

    console.log('Form validation passed, calling API...');

    try {
      let result: User | undefined;
      if (mode === 'create') {
        result = await createUserAndShowToast();
      } else {
        result = await updateUserAndShowToast();
      }

      if (result && onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      console.error('Error saving user:', error);
      addToast({
        title: 'Error',
        description: `Failed to ${mode} user. Please try again.`,
        color: 'danger',
      });
    }
  };

  const handleCancel = () => {
    router.push(ROUTE_PATHS.USERS);
  };

  return (
    <div className="max-w-4xl p-6 mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <Text variant="headerSmall" weight="bold" color="default" as="h1">
          {mode === 'create' ? 'Create User' : 'Edit User'}
        </Text>
        <Button
          variant="light"
          onPress={() => router.back()}
          startContent={<ArrowLeftIcon className="w-4 h-4" />}
        >
          Back
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* User Information Card */}
        <Card>
          <CardHeader>
            <Text variant="titleMedium" weight="medium">
              User Information
            </Text>
          </CardHeader>
          <CardBody>
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <ValidatedInput
                    name="firstName"
                    label="First Name"
                    placeholder="Enter first name"
                    defaultValue={formData.firstName}
                    onValueChange={handleValidatedInputChange}
                    wasSubmitted={wasSubmitted}
                    fieldSchema={fieldSchemas.firstName}
                    isRequired
                    variant="bordered"
                  />
                </div>

                <div className="space-y-1">
                  <ValidatedInput
                    name="lastName"
                    label="Last Name"
                    placeholder="Enter last name"
                    defaultValue={formData.lastName}
                    onValueChange={handleValidatedInputChange}
                    wasSubmitted={wasSubmitted}
                    fieldSchema={fieldSchemas.lastName}
                    isRequired
                    variant="bordered"
                  />
                </div>

                <div className="space-y-1">
                  <ValidatedInput
                    name="email"
                    label="Email"
                    type="email"
                    placeholder="Enter email address"
                    defaultValue={formData.email}
                    onValueChange={handleValidatedInputChange}
                    wasSubmitted={wasSubmitted}
                    fieldSchema={fieldSchemas.email}
                    isRequired
                    variant="bordered"
                  />
                </div>

                <div className="space-y-1">
                  <ValidatedInput
                    name="username"
                    label="Username"
                    placeholder="Enter username"
                    defaultValue={formData.username}
                    onValueChange={handleValidatedInputChange}
                    wasSubmitted={wasSubmitted}
                    fieldSchema={fieldSchemas.username}
                    isRequired
                    variant="bordered"
                  />
                </div>
              </div>

              {/* Password fields - show for create mode or edit mode */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <ValidatedInput
                    name="password"
                    label={mode === 'edit' ? 'New Password (optional)' : 'Password'}
                    type="password"
                    placeholder={
                      mode === 'edit'
                        ? 'Enter new password (leave blank to keep current)'
                        : 'Enter password'
                    }
                    defaultValue={formData.password}
                    onValueChange={handleValidatedInputChange}
                    wasSubmitted={wasSubmitted}
                    fieldSchema={
                      mode === 'edit'
                        ? z
                            .string()
                            .optional()
                            .refine(
                              (val) => !val || val.length >= 8,
                              'Password must be at least 8 characters if provided'
                            )
                        : fieldSchemas.password
                    }
                    isRequired={mode === 'create'}
                    variant="bordered"
                  />
                </div>

                <div className="space-y-1">
                  <ValidatedInput
                    name="confirmPassword"
                    label={mode === 'edit' ? 'Confirm New Password' : 'Confirm Password'}
                    type="password"
                    placeholder={mode === 'edit' ? 'Confirm new password' : 'Confirm password'}
                    defaultValue={formData.confirmPassword}
                    onValueChange={handleValidatedInputChange}
                    wasSubmitted={wasSubmitted}
                    fieldSchema={
                      mode === 'edit'
                        ? z
                            .string()
                            .optional()
                            .refine((val) => val === formData.password, 'Passwords do not match')
                        : getConfirmPasswordSchema(formData.password)
                    }
                    isRequired={
                      mode === 'create' || (mode === 'edit' && formData.password.length > 0)
                    }
                    variant="bordered"
                  />
                </div>
              </div>

              {mode === 'edit' && (
                <div className="flex items-center gap-3 p-3 border rounded-lg border-warning-500 bg-warning-500/20 text-warning-500">
                  <TriangleAlert />
                  <Text variant="bodySmall" color="muted" className="text-warning-500">
                    Leave password fields blank to keep the current password unchanged.
                  </Text>
                </div>
              )}

              {/* Status */}
              <div className="space-y-2">
                <Checkbox
                  isSelected={formData.isActive}
                  onValueChange={(value) => handleValueChange('isActive', value)}
                >
                  <Text variant="bodyMedium" color="default">
                    Active User
                  </Text>
                </Checkbox>
                <Text variant="bodySmall" color="muted">
                  Inactive users cannot log in to the system
                </Text>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Roles Card */}
        <Card>
          <CardHeader>
            <Text variant="titleMedium" weight="medium">
              Roles
            </Text>
          </CardHeader>
          <CardBody>
            <div className="space-y-2">
              <Select
                label="Select Roles"
                isMultiline={true}
                placeholder="Choose user roles"
                selectionMode="multiple"
                selectedKeys={new Set(formData.roleIds)}
                onSelectionChange={(keys) => {
                  const selectedArray = Array.from(keys as Set<string>);
                  handleValueChange('roleIds', selectedArray);
                }}
                isRequired={mode === 'create'}
                isInvalid={fieldErrors.roleIds && fieldErrors.roleIds.length > 0}
                errorMessage={fieldErrors.roleIds?.[0]}
                variant="bordered"
                className="w-full"
                renderValue={(items) => (
                  <div className="flex flex-wrap gap-2">
                    {items.map((item) => (
                      <Chip key={item.key} color="primary" size="sm" variant="flat">
                        {item.textValue}
                      </Chip>
                    ))}
                  </div>
                )}
              >
                {roles.map((role) => (
                  <SelectItem key={role.id} textValue={role.name}>
                    {role.name}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </CardBody>
        </Card>

        {/* Branches Card */}
        <Card>
          <CardHeader>
            <Text variant="titleMedium" weight="medium">
              Branches
            </Text>
          </CardHeader>
          <CardBody>
            <div className="space-y-2">
              <Select
                label="Select Branches"
                isMultiline={true}
                placeholder="Choose user branches"
                selectionMode="multiple"
                selectedKeys={new Set(formData.branchIds)}
                onSelectionChange={(keys) => {
                  const selectedArray = Array.from(keys as Set<string>);
                  handleValueChange('branchIds', selectedArray);
                }}
                isRequired={mode === 'create'}
                isInvalid={fieldErrors.branchIds && fieldErrors.branchIds.length > 0}
                errorMessage={fieldErrors.branchIds?.[0]}
                variant="bordered"
                className="w-full"
                renderValue={(items) => (
                  <div className="flex flex-wrap gap-2">
                    {items.map((item) => (
                      <Chip key={item.key} color="secondary" size="sm" variant="flat">
                        {item.textValue}
                      </Chip>
                    ))}
                  </div>
                )}
              >
                {branches.map((branch) => (
                  <SelectItem key={branch.id} textValue={`${branch.name} - ${branch.code}`}>
                    {branch.name} ({branch.code})
                  </SelectItem>
                ))}
              </Select>
            </div>
          </CardBody>
        </Card>

        {/* Form Actions - Outside cards, bottom-right */}
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="flat" onPress={handleCancel} isDisabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" color="primary" isLoading={isLoading} className="min-w-24">
            {mode === 'create' ? 'Create User' : 'Update User'}
          </Button>
        </div>
      </form>
    </div>
  );
}
