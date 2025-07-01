'use client';

import {
  Button,
  Chip,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Tooltip,
} from '@heroui/react';
import { ROLE_PERMISSIONS } from '@supplysense/types';
import { Edit, Eye, MoreVertical, Shield, Trash2, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Text } from '@/components/ui/Text';
import { ROUTE_PATHS } from '@/config/routes';
import { usePermissions } from '@/hooks/usePermissions';
import type { Role } from '@/store/api/roleApi';

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

  // Permissions
  const canView = hasPermission(ROLE_PERMISSIONS.READ);
  const canEdit = hasPermission(ROLE_PERMISSIONS.UPDATE);
  const canDelete = hasPermission(ROLE_PERMISSIONS.DELETE);

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
            onPress={() => console.log('Delete role:', role.id)}
          >
            Delete Role
          </DropdownItem>
        );
      }

      return (
        <Dropdown>
          <DropdownTrigger>
            <Button isIconOnly size="sm" variant="light">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownTrigger>
          <DropdownMenu aria-label="Role actions">{items}</DropdownMenu>
        </Dropdown>
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
