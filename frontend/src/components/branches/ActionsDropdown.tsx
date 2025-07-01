import { BanIcon, DotsVerticalIcon, EditIcon, EyeIcon, TrashIcon } from '@/components/icons';
import { PermissionGuard } from '@/components/ui/PermissionGuard';
import type { Branch } from '@/store/api/branchApi';
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@heroui/react';
import { BRANCH_PERMISSIONS } from '@supplysense/types';

interface ActionsDropdownProps {
  branch: Branch;
  onViewDetails: (branchId: string) => void;
  onEdit: (branch: Branch) => void;
  onDelete: (branch: Branch, deleteType: 'soft' | 'hard') => void;
}

export function ActionsDropdown({ branch, onViewDetails, onEdit, onDelete }: ActionsDropdownProps) {
  return (
    <Dropdown>
      <DropdownTrigger>
        <Button isIconOnly size="sm" variant="light" aria-label="Actions">
          <DotsVerticalIcon className="w-4 h-4" />
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label="Branch actions">
        <DropdownItem
          key="view"
          startContent={<EyeIcon className="w-4 h-4" />}
          onPress={() => onViewDetails(branch.id)}
        >
          View Details
        </DropdownItem>

        <PermissionGuard permission={BRANCH_PERMISSIONS.UPDATE}>
          <DropdownItem
            key="edit"
            startContent={<EditIcon className="w-4 h-4" />}
            onPress={() => onEdit(branch)}
          >
            Edit
          </DropdownItem>
        </PermissionGuard>

        <PermissionGuard permission={BRANCH_PERMISSIONS.UPDATE}>
          <DropdownItem
            key="deactivate"
            className="text-warning"
            color="warning"
            startContent={<BanIcon className="w-4 h-4" />}
            onPress={() => onDelete(branch, 'soft')}
          >
            {branch.isActive ? 'Deactivate' : 'Activate'}
          </DropdownItem>
        </PermissionGuard>

        <PermissionGuard permission={BRANCH_PERMISSIONS.DELETE}>
          <DropdownItem
            key="delete"
            className="text-danger"
            color="danger"
            startContent={<TrashIcon className="w-4 h-4" />}
            onPress={() => onDelete(branch, 'hard')}
          >
            Delete Permanently
          </DropdownItem>
        </PermissionGuard>
      </DropdownMenu>
    </Dropdown>
  );
}
