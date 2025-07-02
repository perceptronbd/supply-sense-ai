'use client';

// 1. React and core Next.js imports
import { useParams, useRouter } from 'next/navigation';

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
  addToast,
  useDisclosure,
} from '@heroui/react';
import { ROLE_PERMISSIONS } from '@supplysense/types';
import { format } from 'date-fns';
import { AlertTriangle, ArrowLeftIcon, Edit, Shield, Trash2, Users } from 'lucide-react';

// 3. Internal alias imports - Store/API
import { useDeleteRoleMutation, useGetRoleQuery } from '@/store/api/roleApi';

// 4. Internal alias imports - Components
import AuthGuard from '@/components/AuthGuard';
import { DrawingLogo } from '@/components/ui/DrawingLogo';
import { PermissionGuard } from '@/components/ui/PermissionGuard';
import { Text } from '@/components/ui/Text';
import { ROUTE_PATHS } from '@/config/routes';

export default function RoleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const roleId = params.id as string;

  const { data: role, isLoading, error } = useGetRoleQuery(roleId);
  const [deleteRole, { isLoading: isDeleting }] = useDeleteRoleMutation();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onOpenChange: onDeleteOpenChange,
  } = useDisclosure();

  const handleEdit = () => {
    router.push(`${ROUTE_PATHS.ROLES}/${roleId}/edit`);
  };

  const handleBack = () => {
    router.push(ROUTE_PATHS.ROLES);
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
      router.push(ROUTE_PATHS.ROLES);
    } catch (error: unknown) {
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
            : 'Failed to delete role';

      addToast({
        title: 'Error',
        description: errorMessage,
        color: 'danger',
      });
    }
  };

  if (isLoading) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="flex items-center justify-center min-h-screen">
          <DrawingLogo size={60} variant="primary" speed="fast" showFill={true} />
        </div>
      </AuthGuard>
    );
  }

  if (error || !role) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="p-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Text variant="bodyLarge" weight="medium" color="danger">
              Role not found
            </Text>
            <Text variant="bodySmall" color="muted" className="mt-2">
              The role you're looking for doesn't exist or you don't have permission to view it.
            </Text>
            <Button color="primary" variant="flat" className="mt-4" onPress={handleBack}>
              Back to Roles
            </Button>
          </div>
        </div>
      </AuthGuard>
    );
  }

  // Group permissions by module for display
  const permissionsByModule =
    role.permissions?.reduce(
      (acc, permission) => {
        const module = permission.module;
        if (!acc[module]) {
          acc[module] = [];
        }
        acc[module].push(permission);
        return acc;
      },
      {} as Record<string, typeof role.permissions>
    ) || {};

  return (
    <AuthGuard requireAuth={true}>
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
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Text variant="headerSmall" weight="semiBold" color="default" as="h1">
                  {role.name}
                </Text>
                <Switch size="sm" isSelected={role.isActive} color="success" isDisabled>
                  <Text variant="bodySmall" color={role.isActive ? 'success' : 'default'}>
                    {role.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </Switch>
              </div>
              {role.description && (
                <Text variant="bodyMedium" color="muted" as="p">
                  {role.description}
                </Text>
              )}
            </div>
            <div className="flex gap-2">
              <PermissionGuard permission={ROLE_PERMISSIONS.UPDATE}>
                <Button
                  color="primary"
                  startContent={<Edit className="w-4 h-4" />}
                  onPress={handleEdit}
                >
                  Edit Role
                </Button>
              </PermissionGuard>
              <PermissionGuard permission={ROLE_PERMISSIONS.DELETE}>
                <Button
                  color="danger"
                  variant="flat"
                  startContent={<Trash2 className="w-4 h-4" />}
                  onPress={onDeleteOpen}
                  isDisabled={isDeleting}
                >
                  Delete
                </Button>
              </PermissionGuard>
            </div>
          </header>

          {/* Role Information */}
          <Card>
            <CardHeader>
              <Text variant="titleMedium" weight="medium">
                Role Information
              </Text>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <Text variant="bodySmall" color="muted" className="mb-1">
                      Role Name
                    </Text>
                    <Text variant="bodyMedium" weight="medium">
                      {role.name}
                    </Text>
                  </div>
                  <div>
                    <Text variant="bodySmall" color="muted" className="mb-1">
                      Description
                    </Text>
                    <Text variant="bodyMedium" weight="medium">
                      {role.description || 'No description provided'}
                    </Text>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Text variant="bodySmall" color="muted" className="mb-1">
                      Status
                    </Text>
                    <Switch size="sm" isSelected={role.isActive} color="success" isDisabled>
                      <Text variant="bodySmall" color={role.isActive ? 'success' : 'default'}>
                        {role.isActive ? 'Active' : 'Inactive'}
                      </Text>
                    </Switch>
                  </div>
                  <div>
                    <Text variant="bodySmall" color="muted" className="mb-1">
                      Created
                    </Text>
                    <Text variant="bodyMedium" weight="medium">
                      {format(new Date(role.createdAt), 'PPpp')}
                    </Text>
                  </div>
                  <div>
                    <Text variant="bodySmall" color="muted" className="mb-1">
                      Last Updated
                    </Text>
                    <Text variant="bodyMedium" weight="medium">
                      {format(new Date(role.updatedAt), 'PPpp')}
                    </Text>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Permissions - Discord Style */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <Text variant="titleMedium" weight="medium">
                    Permissions
                  </Text>
                </div>
                <Chip color="primary" variant="flat" size="sm">
                  {role.permissions?.length || 0} permissions
                </Chip>
              </div>
            </CardHeader>
            <CardBody>
              {role.permissions && role.permissions.length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(permissionsByModule).map(([module, permissions]) => (
                    <div key={module} className="border rounded-lg border-divider bg-content1">
                      {/* Module Header - Discord Style */}
                      <div className="flex items-center justify-between p-3 border-b bg-content2/50 border-divider">
                        <div className="flex items-center gap-3">
                          <Switch size="sm" isSelected={true} color="success" isDisabled />
                          <Text variant="bodyMedium" weight="semiBold" className="capitalize">
                            {module.replace(/_/g, ' ').toLowerCase()}
                          </Text>
                          <Chip size="sm" variant="flat" color="success">
                            {permissions.length} permissions
                          </Chip>
                        </div>
                      </div>

                      {/* Permission List - Discord Style */}
                      <div className="p-3">
                        <div className="space-y-2">
                          {permissions.map((permission) => (
                            <div
                              key={permission.id}
                              className="flex items-center justify-between p-2 rounded-md bg-content2/20"
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
                              <Switch size="sm" isSelected={true} color="success" isDisabled />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Shield className="w-12 h-12 mx-auto mb-4 text-default-300" />
                  <Text variant="bodyMedium" color="muted">
                    No permissions assigned to this role
                  </Text>
                  <Text variant="bodySmall" color="muted" className="mt-1">
                    Users with this role will have no access to system features
                  </Text>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Users with this Role */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <Text variant="titleMedium" weight="medium">
                    Users with this Role
                  </Text>
                </div>
                <Chip color="secondary" variant="flat" size="sm">
                  {role.userCount || 0} users
                </Chip>
              </div>
            </CardHeader>
            <CardBody>
              <div className="py-8 text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-default-300" />
                <Text variant="bodyMedium" color="muted">
                  {role.userCount || 0} users have this role
                </Text>
                <Text variant="bodySmall" color="muted" className="mt-1">
                  User management for roles is handled through the Users module
                </Text>
                <PermissionGuard permission={ROLE_PERMISSIONS.READ}>
                  <Button
                    variant="flat"
                    color="primary"
                    className="mt-4"
                    onPress={() => router.push(`${ROUTE_PATHS.USERS}?role=${roleId}`)}
                  >
                    View Users with this Role
                  </Button>
                </PermissionGuard>
              </div>
            </CardBody>
          </Card>

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
                      Are you sure you want to delete the role "{role.name}"? This action cannot be
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
    </AuthGuard>
  );
}
