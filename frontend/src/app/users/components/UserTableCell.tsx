'use client';

import { useRouter } from 'next/navigation';
// 1. React and core Next.js imports
import { useCallback } from 'react';

// 2. External library imports
import {
  Avatar,
  Button,
  Chip,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from '@heroui/react';
import { USER_PERMISSIONS } from '@supplysense/types';
import { format } from 'date-fns';
import { Edit, Eye, MoreVertical, Shield, Trash2, UserCheck, Users } from 'lucide-react';

// 3. Internal alias imports - Store/API
import type { User } from '@/store/api/userApi';
import { useActivateUserMutation, useDeleteUserMutation } from '@/store/api/userApi';

// 4. Internal alias imports - Components and Config
import { Text } from '@/components/ui/Text';
import { ROUTE_PATHS } from '@/config/routes';
import { usePermissions } from '@/hooks/usePermissions';

interface UserTableCellProps {
  user: User & { name: string };
  columnKey: string | number;
}

export function UserTableCell({ user, columnKey }: UserTableCellProps) {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const [activateUser] = useActivateUserMutation();
  const [deleteUser] = useDeleteUserMutation();

  const canUpdate = hasPermission(USER_PERMISSIONS.UPDATE);
  const canDelete = hasPermission(USER_PERMISSIONS.DELETE);
  const canManage = hasPermission(USER_PERMISSIONS.MANAGE);

  const handleView = useCallback(() => {
    router.push(`${ROUTE_PATHS.USERS}/${user.id}`);
  }, [router, user.id]);

  const handleEdit = useCallback(() => {
    router.push(`${ROUTE_PATHS.USERS}/${user.id}/edit`);
  }, [router, user.id]);

  const handleActivate = useCallback(async () => {
    try {
      await activateUser(user.id).unwrap();
    } catch (error) {
      console.error('Failed to activate user:', error);
    }
  }, [activateUser, user.id]);

  const handleDeactivate = useCallback(async () => {
    try {
      await deleteUser(user.id).unwrap();
    } catch (error) {
      console.error('Failed to deactivate user:', error);
    }
  }, [deleteUser, user.id]);

  const renderNameCell = () => (
    <div className="flex items-center gap-3">
      <Avatar
        name={user.name}
        size="sm"
        className="flex-shrink-0"
        color={user.isSuperAdmin ? 'danger' : 'primary'}
      />
      <div className="flex flex-col">
        <Text variant="bodyMedium" weight="medium" color="default">
          {user.name}
        </Text>
        {user.isSuperAdmin && (
          <Chip size="sm" color="danger" variant="flat" className="mt-1">
            Super Admin
          </Chip>
        )}
      </div>
    </div>
  );

  const renderEmailCell = () => (
    <div className="flex flex-col">
      <Text variant="bodySmall" color="default">
        {user.email}
      </Text>
    </div>
  );

  const renderUsernameCell = () => (
    <Text variant="bodySmall" color="default">
      {user.username}
    </Text>
  );

  const renderRolesCell = () => (
    <ul className="flex flex-wrap gap-1">
      {user.roles && user.roles.length > 0 ? (
        user.roles.slice(0, 2).map((role) => (
          <li key={role.id}>
            <Chip size="sm" color="primary" variant="flat">
              {role.name}
            </Chip>
          </li>
        ))
      ) : (
        <li>
          <Text variant="bodySmall" color="muted">
            No roles
          </Text>
        </li>
      )}
      {user.roles && user.roles.length > 2 && (
        <li>
          <Chip size="sm" color="default" variant="flat">
            +{user.roles.length - 2}
          </Chip>
        </li>
      )}
    </ul>
  );

  const renderBranchesCell = () => (
    <ul className="flex flex-wrap gap-1">
      {user.branches && user.branches.length > 0 ? (
        user.branches.slice(0, 2).map((branch) => (
          <li key={branch.id}>
            <Chip size="sm" color="secondary" variant="flat">
              {branch.name}
            </Chip>
          </li>
        ))
      ) : (
        <li>
          <Text variant="bodySmall" color="muted">
            No branches
          </Text>
        </li>
      )}
      {user.branches && user.branches.length > 2 && (
        <li>
          <Chip size="sm" color="default" variant="flat">
            +{user.branches.length - 2}
          </Chip>
        </li>
      )}
    </ul>
  );

  const renderStatusCell = () => (
    <Chip
      size="sm"
      color={user.isActive ? 'success' : 'danger'}
      variant="flat"
      startContent={
        user.isActive ? <UserCheck className="w-3 h-3" /> : <Trash2 className="w-3 h-3" />
      }
    >
      {user.isActive ? 'Active' : 'Inactive'}
    </Chip>
  );

  const renderLastLoginCell = () => (
    <Text variant="bodySmall" color="muted">
      {user.lastLogin ? format(new Date(user.lastLogin), 'MMM dd, yyyy') : 'Never'}
    </Text>
  );

  const renderActionsDropdownItems = () => {
    const items = [];

    items.push(
      <DropdownItem key="view" startContent={<Eye className="w-4 h-4" />} onPress={handleView}>
        View User
      </DropdownItem>
    );

    if (canUpdate) {
      items.push(
        <DropdownItem key="edit" startContent={<Edit className="w-4 h-4" />} onPress={handleEdit}>
          Edit User
        </DropdownItem>
      );
    }

    if (canManage) {
      items.push(
        <DropdownItem
          key="roles"
          startContent={<Shield className="w-4 h-4" />}
          onPress={() => router.push(`${ROUTE_PATHS.USERS}/${user.id}/roles`)}
        >
          Manage Roles
        </DropdownItem>
      );

      items.push(
        <DropdownItem
          key="branches"
          startContent={<Users className="w-4 h-4" />}
          onPress={() => router.push(`${ROUTE_PATHS.USERS}/${user.id}/branches`)}
        >
          Manage Branches
        </DropdownItem>
      );
    }

    if (canDelete && !user.isSuperAdmin) {
      items.push(
        user.isActive ? (
          <DropdownItem
            key="deactivate"
            color="danger"
            startContent={<Trash2 className="w-4 h-4" />}
            onPress={handleDeactivate}
          >
            Deactivate
          </DropdownItem>
        ) : (
          <DropdownItem
            key="activate"
            color="success"
            startContent={<UserCheck className="w-4 h-4" />}
            onPress={handleActivate}
          >
            Activate
          </DropdownItem>
        )
      );
    }

    return items;
  };

  const renderActionsCell = () => (
    <div className="flex items-center justify-end">
      <Dropdown>
        <DropdownTrigger>
          <Button isIconOnly size="sm" variant="light" aria-label="More actions">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownTrigger>
        <DropdownMenu aria-label="User actions">{renderActionsDropdownItems()}</DropdownMenu>
      </Dropdown>
    </div>
  );

  const renderCell = () => {
    switch (columnKey) {
      case 'name':
        return renderNameCell();
      case 'email':
        return renderEmailCell();
      case 'username':
        return renderUsernameCell();
      case 'roles':
        return renderRolesCell();
      case 'branches':
        return renderBranchesCell();
      case 'status':
        return renderStatusCell();
      case 'lastLogin':
        return renderLastLoginCell();
      case 'actions':
        return renderActionsCell();
      default:
        return null;
    }
  };

  return renderCell();
}
