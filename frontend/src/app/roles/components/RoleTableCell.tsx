'use client';

// 1. React and core Next.js imports
import { useRouter } from 'next/navigation';

// 2. External library imports
import {
  Button,
  Chip,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Tooltip,
  addToast,
  useDisclosure,
} from '@heroui/react';
import { ROLE_PERMISSIONS } from '@supplysense/types';
import { AlertTriangle, Edit, Eye, MoreVertical, Shield, Trash2, Users } from 'lucide-react';

// 3. Internal alias imports - Store/API
import { type Role, useDeleteRoleMutation } from '@/store/api/roleApi';

// 4. Internal alias imports - Components
import { Text } from '@/components/ui/Text';
import { ROUTE_PATHS } from '@/config/routes';
import { usePermissions } from '@/hooks/usePermissions';

interface RoleTableCellProps {
  role: Role;
  columnKey: string;
}

// Helper function to render permissions
const renderPermissions = (role: Role) => {
  if (!role.permissions || role.permissions.length === 0) {
    return (
      <div className="flex items-center gap-1">
        <Shield className="w-3 h-3 text-primary" />
        <Text variant="bodySmall" color="default">
          0 permissions
        </Text>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1">
        <Shield className="w-3 h-3 text-primary" />
        <Text variant="bodySmall" color="default">
          {role.permissions.length} permissions
        </Text>
      </div>
      <Tooltip
        content={
          <div className="max-w-xs">
            <Text variant="bodySmall" weight="medium" className="mb-1">
              Permissions:
            </Text>
            <div className="flex flex-wrap gap-1">
              {role.permissions.slice(0, 5).map((permission) => (
                <Chip key={permission.id} size="sm" variant="flat" color="primary">
                  {permission.permission.replace(/_/g, ' ').toLowerCase()}
                </Chip>
              ))}
              {role.permissions.length > 5 && (
                <Text variant="bodySmall" color="muted">
                  +{role.permissions.length - 5} more
                </Text>
              )}
            </div>
          </div>
        }
      >
        <div className="flex flex-wrap max-w-xs gap-1">
          {role.permissions.slice(0, 2).map((permission) => (
            <Chip key={permission.id} size="sm" variant="flat" color="primary" className="text-xs">
              {permission.permission.replace(/_/g, ' ').toLowerCase()}
            </Chip>
          ))}
          {role.permissions.length > 2 && (
            <Chip size="sm" variant="flat" color="default" className="text-xs">
              +{role.permissions.length - 2}
            </Chip>
          )}
        </div>
      </Tooltip>
    </div>
  );
};

export function RoleTableCell({ role, columnKey }: RoleTableCellProps): JSX.Element {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const [deleteRole, { isLoading: isDeleting }] = useDeleteRoleMutation();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onOpenChange: onDeleteOpenChange,
  } = useDisclosure();

  // Permissions
  const canView = hasPermission(ROLE_PERMISSIONS.READ);
  const canEdit = hasPermission(ROLE_PERMISSIONS.UPDATE);
  const canDelete = hasPermission(ROLE_PERMISSIONS.DELETE);

  const handleDelete = async () => {
    try {
      await deleteRole(role.id).unwrap();
      addToast({
        title: 'Success',
        description: 'Role deleted successfully',
        color: 'success',
      });
      onDeleteOpenChange();
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

  switch (columnKey) {
    case 'name':
      return (
        <div className="flex flex-col">
          <Text variant="bodyMedium" weight="medium" color="default">
            {role.name}
          </Text>
        </div>
      );

    case 'description':
      return (
        <div className="flex flex-col">
          <Text variant="bodySmall" color="muted" className="max-w-xs truncate">
            {role.description || 'No description'}
          </Text>
        </div>
      );

    case 'permissions':
      return renderPermissions(role);

    case 'users':
      return (
        <div className="flex items-center gap-1">
          <Users className="w-3 h-3 text-default-400" />
          <Text variant="bodySmall" color="default">
            {role.userCount || 0} users
          </Text>
        </div>
      );

    case 'status':
      return (
        <Chip size="sm" variant="flat" color={role.isActive ? 'success' : 'default'}>
          {role.isActive ? 'Active' : 'Inactive'}
        </Chip>
      );

    case 'actions': {
      const items = [];

      if (canView) {
        items.push(
          <DropdownItem
            key="view"
            startContent={<Eye className="w-4 h-4" />}
            onPress={() => router.push(`${ROUTE_PATHS.ROLES}/${role.id}`)}
          >
            View Details
          </DropdownItem>
        );
      }

      if (canEdit) {
        items.push(
          <DropdownItem
            key="edit"
            startContent={<Edit className="w-4 h-4" />}
            onPress={() => router.push(`${ROUTE_PATHS.ROLES}/${role.id}/edit`)}
          >
            Edit Role
          </DropdownItem>
        );
      }

      if (canDelete) {
        items.push(
          <DropdownItem
            key="delete"
            className="text-danger"
            color="danger"
            startContent={<Trash2 className="w-4 h-4" />}
            onPress={onDeleteOpen}
          >
            Delete Role
          </DropdownItem>
        );
      }

      return (
        <div>
          <Dropdown>
            <DropdownTrigger>
              <Button isIconOnly size="sm" variant="light">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Role actions">{items}</DropdownMenu>
          </Dropdown>

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
      );
    }

    default:
      return (
        <Text variant="bodySmall" color="muted">
          -
        </Text>
      );
  }
}
