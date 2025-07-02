'use client';

import { useRouter } from 'next/navigation';
// 1. React and core Next.js imports
import { useEffect, useState } from 'react';

// 2. External library imports
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Switch,
  Textarea,
  addToast,
  useDisclosure,
} from '@heroui/react';
import { AlertTriangle, Minus, Plus, Shield, Trash2 } from 'lucide-react';
import { z } from 'zod';

// 3. Internal alias imports - Store/API
import {
  type Role,
  useAssignPermissionsMutation,
  useCreateRoleMutation,
  useDeleteRoleMutation,
  useGetPermissionsByModuleQuery,
  useUpdateRoleMutation,
} from '@/store/api/roleApi';

// 4. Internal alias imports - Components
import { ArrowLeftIcon } from '@/components/icons';
import { Text } from '@/components/ui/Text';
import { ValidatedInput } from '@/components/ui/ValidatedInput';
import { ROUTE_PATHS } from '@/config/routes';

// Custom form data type without permissionIds since we handle it separately
interface RoleFormData {
  name: string;
  description: string;
  isActive: boolean;
}

interface RoleFormProps {
  role?: Role;
  mode: 'create' | 'edit';
  onSuccess?: (role: Role) => void;
  onDelete?: () => void;
}

export function RoleForm({ role, mode, onSuccess, onDelete }: RoleFormProps) {
  const router = useRouter();
  const [createRoleMutation, { isLoading: isCreating }] = useCreateRoleMutation();
  const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();
  const [assignPermissions, { isLoading: isAssigningPermissions }] = useAssignPermissionsMutation();
  const [deleteRole, { isLoading: isDeleting }] = useDeleteRoleMutation();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onOpenChange: onDeleteOpenChange,
  } = useDisclosure();

  // Fetch permissions for the form
  const { data: permissionsByModule = {} } = useGetPermissionsByModuleQuery();

  const isLoading = isCreating || isUpdating || isAssigningPermissions || isDeleting;
  const [formData, setFormData] = useState<RoleFormData>({
    name: role?.name || '',
    description: role?.description || '',
    isActive: role?.isActive ?? true,
  });
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set(role?.permissions?.map((p) => p.id) || [])
  );
  const [wasSubmitted, setWasSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  // Define individual field schemas for ValidatedInput
  const fieldSchemas = {
    name: z
      .string()
      .min(1, 'Role name is required')
      .max(50, 'Role name must be less than 50 characters')
      .regex(
        /^[a-zA-Z0-9\s_-]+$/,
        'Role name can only contain letters, numbers, spaces, hyphens, and underscores'
      ),
    description: z.string().max(255, 'Description must be less than 255 characters').optional(),
  };

  // Update form when role changes
  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name,
        description: role.description || '',
        isActive: role.isActive,
      });
      setSelectedPermissions(new Set(role.permissions?.map((p) => p.id) || []));
    }
  }, [role]);

  // Initialize expanded modules to show all modules initially
  useEffect(() => {
    const moduleNames = Object.keys(permissionsByModule);
    const initialExpanded: Record<string, boolean> = {};
    for (const module of moduleNames) {
      initialExpanded[module] = true;
    }
    setExpandedModules(initialExpanded);
  }, [permissionsByModule]);

  const handleValueChange = (name: string, value: string | boolean | string[]) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear field errors when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: [] }));
    }
  };

  const handleValidatedInputChange = (name: string, value: string) => {
    handleValueChange(name, value);
  };

  const handlePermissionToggle = (permissionId: string) => {
    const isSelected = selectedPermissions.has(permissionId);

    if (isSelected) {
      setSelectedPermissions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(permissionId);
        return newSet;
      });
    } else {
      setSelectedPermissions((prev) => new Set([...prev, permissionId]));
    }

    // Clear permission errors when user makes changes
    if (errors.permissionIds) {
      setErrors((prev) => ({ ...prev, permissionIds: [] }));
    }
  };

  const handleModuleToggle = (module: string) => {
    const modulePermissions = permissionsByModule[module] || [];
    const modulePermissionIds = modulePermissions.map((p) => p.id);

    const allSelected = modulePermissionIds.every((id) => selectedPermissions.has(id));

    if (allSelected) {
      // Remove all permissions from this module
      setSelectedPermissions((prev) => {
        const newSet = new Set(prev);
        for (const id of modulePermissionIds) {
          newSet.delete(id);
        }
        return newSet;
      });
    } else {
      // Add all permissions from this module
      setSelectedPermissions((prev) => {
        const newSet = new Set(prev);
        for (const id of modulePermissionIds) {
          newSet.add(id);
        }
        return newSet;
      });
    }

    // Clear permission errors when user makes changes
    if (errors.permissionIds) {
      setErrors((prev) => ({ ...prev, permissionIds: [] }));
    }
  };

  const toggleModuleExpansion = (module: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [module]: !prev[module],
    }));
  };

  const validateFormData = (): boolean => {
    const validationErrors: Record<string, string[]> = {};

    // Validate name
    if (!formData.name.trim()) {
      validationErrors.name = ['Role name is required'];
    } else if (formData.name.length < 2) {
      validationErrors.name = ['Role name must be at least 2 characters'];
    } else if (formData.name.length > 50) {
      validationErrors.name = ['Role name must not exceed 50 characters'];
    }

    // Validate description
    if (formData.description && formData.description.length > 255) {
      validationErrors.description = ['Description must not exceed 255 characters'];
    }

    // Validate permissions
    if (selectedPermissions.size === 0) {
      validationErrors.permissionIds = ['At least one permission must be selected'];
    }

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  // Helper function to prepare permission updates
  const preparePermissionUpdates = () => {
    if (!role?.permissions) return { toAdd: [], toRemove: [] };

    const existingPermissionIds = new Set(role.permissions.map((p) => p.id));
    const selectedPermissionIds = selectedPermissions;

    return {
      toAdd: [...selectedPermissionIds].filter((id) => !existingPermissionIds.has(id)),
      toRemove: [...existingPermissionIds].filter((id) => !selectedPermissionIds.has(id)),
    };
  };

  // Helper function for error handling
  const handleError = (error: unknown, defaultMessage: string) => {
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === 'object' &&
            error !== null &&
            'data' in error &&
            typeof error.data === 'object' &&
            error.data !== null &&
            'message' in error.data
          ? String(error.data.message)
          : defaultMessage;

    addToast({
      title: 'Error',
      description: errorMessage,
      color: 'danger',
    });
    return errorMessage;
  };

  const updateRoleAndShowToast = async (): Promise<Role | undefined> => {
    if (!role) {
      return;
    }

    try {
      // Update basic role information
      const updatedRole = await updateRole({
        id: role.id,
        roleData: {
          name: formData.name,
          description: formData.description,
          isActive: formData.isActive,
        },
      }).unwrap();

      // Prepare permission updates
      const { toAdd, toRemove } = preparePermissionUpdates();

      // Update permissions if there are changes
      let finalRole = updatedRole;
      if (toAdd.length > 0 || toRemove.length > 0) {
        finalRole = await assignPermissions({
          id: role.id,
          permissionsData: {
            permissionIds: Array.from(selectedPermissions),
            action: 'replace',
          },
        }).unwrap();
      }

      addToast({
        title: 'Success',
        description: 'Role updated successfully',
        color: 'success',
      });

      return finalRole;
    } catch (error: unknown) {
      handleError(error, 'Failed to update role');
      return undefined;
    }
  };

  const createNewRole = async () => {
    const result = await createRoleMutation({
      ...formData,
      permissionIds: Array.from(selectedPermissions),
    }).unwrap();

    addToast({
      title: 'Success',
      description: 'Role created successfully',
      color: 'success',
    });

    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWasSubmitted(true);

    // Validate form data
    const isValid = validateFormData();
    if (!isValid) {
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const result = mode === 'create' ? await createNewRole() : await updateRoleAndShowToast();

      if (result) {
        setFormData({ name: '', description: '', isActive: true });
        setSelectedPermissions(new Set());
        if (onSuccess) {
          onSuccess(result);
        } else {
          router.push(ROUTE_PATHS.ROLES);
        }
      }
    } catch (error: unknown) {
      handleError(error, mode === 'create' ? 'Failed to create role' : 'Failed to update role');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!role) return;

    try {
      await deleteRole(role.id).unwrap();
      addToast({
        title: 'Success',
        description: 'Role deleted successfully',
        color: 'success',
      });
      onDeleteOpenChange();
      if (onDelete) {
        onDelete();
      } else {
        router.push(ROUTE_PATHS.ROLES);
      }
    } catch (error: unknown) {
      handleError(error, 'Failed to delete role');
      if (onDelete) {
        onDelete();
      }
    }
  };

  const handleCancel = () => {
    router.push(ROUTE_PATHS.ROLES);
  };

  const getSelectedPermissionCount = (module: string): number => {
    const modulePermissions = permissionsByModule[module] || [];
    return modulePermissions.filter((p) => selectedPermissions.has(p.id)).length;
  };

  const isModuleFullySelected = (module: string): boolean => {
    const modulePermissions = permissionsByModule[module] || [];
    return (
      modulePermissions.length > 0 && modulePermissions.every((p) => selectedPermissions.has(p.id))
    );
  };

  const isModulePartiallySelected = (module: string): boolean => {
    const modulePermissions = permissionsByModule[module] || [];
    const selectedCount = getSelectedPermissionCount(module);
    return selectedCount > 0 && selectedCount < modulePermissions.length;
  };

  return (
    <main className="p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button
          variant="light"
          onPress={() => router.back()}
          startContent={<ArrowLeftIcon className="w-4 h-4" />}
        >
          Back
        </Button>
        {/* Header */}
        <header className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <Text variant="headerSmall" weight="semiBold" color="default" as="h1">
              {mode === 'create' ? 'Create Role' : 'Edit Role'}
            </Text>
            <Text variant="bodySmall" color="muted" as="p">
              {mode === 'create'
                ? 'Create a new role with specific permissions'
                : 'Update role details and permissions'}
            </Text>
          </div>
          {mode === 'edit' && role && (
            <Button
              color="danger"
              variant="flat"
              startContent={<Trash2 className="w-4 h-4" />}
              onPress={onDeleteOpen}
              isDisabled={isLoading}
            >
              Delete Role
            </Button>
          )}
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <Text variant="titleMedium" weight="medium">
                Basic Information
              </Text>
            </CardHeader>
            <CardBody className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <ValidatedInput
                  name="name"
                  label="Role Name"
                  placeholder="Enter role name"
                  value={formData.name}
                  fieldSchema={fieldSchemas.name}
                  wasSubmitted={wasSubmitted}
                  errors={errors.name}
                  onValueChange={handleValidatedInputChange}
                  isRequired
                />
                <div className="flex items-center gap-3">
                  <Switch
                    isSelected={formData.isActive}
                    onValueChange={(value) => handleValueChange('isActive', value)}
                    color="success"
                  >
                    <Text variant="bodyMedium">Active</Text>
                  </Switch>
                </div>
              </div>
              <Textarea
                label="Description"
                placeholder="Enter role description (optional)"
                value={formData.description}
                onValueChange={(value) => handleValueChange('description', value)}
                maxLength={255}
                variant="bordered"
              />
            </CardBody>
          </Card>

          {/* Permissions - Discord Style */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <Text variant="titleMedium" weight="medium">
                    Permissions
                  </Text>
                </div>
                <Chip color="primary" variant="flat" size="sm">
                  {selectedPermissions.size} selected
                </Chip>
              </div>
              {errors.permissionIds && (
                <div className="mt-2">
                  {errors.permissionIds.map((error) => (
                    <Text key={error} variant="bodySmall" color="danger">
                      {error}
                    </Text>
                  ))}
                </div>
              )}
            </CardHeader>
            <CardBody className="space-y-2">
              {Object.entries(permissionsByModule).map(([module, permissions]) => (
                <div key={module} className="border rounded-lg border-divider bg-content1">
                  {/* Module Header - Discord Style */}
                  <div className="flex items-center justify-between p-3 border-b bg-content2/50 border-divider">
                    <div className="flex items-center gap-3">
                      <Switch
                        size="sm"
                        isSelected={isModuleFullySelected(module)}
                        color={isModulePartiallySelected(module) ? 'warning' : 'success'}
                        onValueChange={() => handleModuleToggle(module)}
                      />
                      <Text variant="bodyMedium" weight="semiBold" className="capitalize">
                        {module.replace(/_/g, ' ').toLowerCase()}
                      </Text>
                      <Chip
                        size="sm"
                        variant="flat"
                        color={
                          isModuleFullySelected(module)
                            ? 'success'
                            : isModulePartiallySelected(module)
                              ? 'warning'
                              : 'default'
                        }
                      >
                        {getSelectedPermissionCount(module)} / {permissions.length}
                      </Chip>
                    </div>
                    <Button
                      size="sm"
                      variant="light"
                      isIconOnly
                      onPress={() => toggleModuleExpansion(module)}
                    >
                      {expandedModules[module] ? (
                        <Minus className="w-4 h-4" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  {/* Permission List - Discord Style */}
                  {expandedModules[module] && (
                    <div className="p-3">
                      <div className="space-y-2">
                        {permissions.map((permission) => (
                          <div
                            key={permission.id}
                            className="flex items-center justify-between p-2 transition-colors rounded-md hover:bg-content2/30"
                          >
                            <div className="flex-1">
                              <Text variant="bodySmall" weight="medium">
                                {permission.action.replace(/_/g, ' ').toLowerCase()}
                              </Text>
                              {permission.description && (
                                <Text variant="bodyXSmall" color="muted" className="mt-1">
                                  {permission.description}
                                </Text>
                              )}
                            </div>
                            <Switch
                              size="sm"
                              isSelected={selectedPermissions.has(permission.id)}
                              onValueChange={() => handlePermissionToggle(permission.id)}
                              color="success"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardBody>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button variant="flat" onPress={handleCancel} isDisabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" color="primary" isLoading={isSubmitting}>
              {mode === 'create' ? 'Create Role' : 'Update Role'}
            </Button>
          </div>
        </form>

        {/* Delete Confirmation Modal */}
        <Modal isOpen={isDeleteOpen} onOpenChange={onDeleteOpenChange} size="md">
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-danger" />
                  <Text variant="titleMedium" weight="semiBold">
                    Delete Role
                  </Text>
                </ModalHeader>
                <ModalBody>
                  <Text variant="bodyMedium">
                    Are you sure you want to delete the role "{role?.name}"? This action cannot be
                    undone.
                  </Text>
                  <div className="p-3 border rounded-md bg-danger-50 border-danger-200">
                    <Text variant="bodySmall" color="danger" weight="medium">
                      Warning: Users assigned to this role will lose their permissions.
                    </Text>
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button variant="flat" onPress={onClose} isDisabled={isDeleting}>
                    Cancel
                  </Button>
                  <Button
                    color="danger"
                    onPress={handleDelete}
                    isLoading={isDeleting}
                    startContent={!isDeleting ? <Trash2 className="w-4 h-4" /> : undefined}
                  >
                    Delete Role
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    </main>
  );
}
