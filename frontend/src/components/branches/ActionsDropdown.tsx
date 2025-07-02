import { BanIcon, DotsVerticalIcon, EditIcon, EyeIcon, TrashIcon } from '@/components/icons';
import { usePermissions } from '@/hooks/usePermissions';
import type { Branch } from '@/store/api/branchApi';
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@heroui/react';
import { BRANCH_PERMISSIONS } from '@supplysense/types';
import { useMemo } from 'react';

interface ActionsDropdownProps {
  branch: Branch;
  onViewDetails: (branchId: string) => void;
  onEdit: (branch: Branch) => void;
  onDelete: (branch: Branch, deleteType: 'soft' | 'hard') => void;
}

export function ActionsDropdown({ branch, onViewDetails, onEdit, onDelete }: ActionsDropdownProps) {
  const { hasPermission } = usePermissions();

  const actions = useMemo(() => {
    const actionsList = [
      {
        key: 'view',
        label: 'View Details',
        icon: <EyeIcon className="w-4 h-4" />,
        onPress: () => onViewDetails(branch.id),
        className: '',
      },
    ];

    if (hasPermission(BRANCH_PERMISSIONS.UPDATE)) {
      actionsList.push({
        key: 'edit',
        label: 'Edit',
        icon: <EditIcon className="w-4 h-4" />,
        onPress: () => onEdit(branch),
        className: '',
      });

      actionsList.push({
        key: 'deactivate',
        label: branch.isActive ? 'Deactivate' : 'Activate',
        icon: <BanIcon className="w-4 h-4" />,
        onPress: () => onDelete(branch, 'soft'),
        className: 'text-warning',
      });
    }

    if (hasPermission(BRANCH_PERMISSIONS.DELETE)) {
      actionsList.push({
        key: 'delete',
        label: 'Delete Permanently',
        icon: <TrashIcon className="w-4 h-4" />,
        onPress: () => onDelete(branch, 'hard'),
        className: 'text-danger',
      });
    }

    return actionsList;
  }, [hasPermission, branch, onViewDetails, onEdit, onDelete]);

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button isIconOnly size="sm" variant="light" aria-label="Actions">
          <DotsVerticalIcon className="w-4 h-4" />
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label="Branch actions">
        {actions.map((action) => (
          <DropdownItem
            key={action.key}
            startContent={action.icon}
            onPress={action.onPress}
            className={action.className}
            color={
              action.key === 'delete'
                ? 'danger'
                : action.key === 'deactivate'
                  ? 'warning'
                  : 'default'
            }
          >
            {action.label}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}
