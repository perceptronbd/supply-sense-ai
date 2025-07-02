import { BanIcon, DotsVerticalIcon, EditIcon, EyeIcon, TrashIcon } from '@/components/icons';
import { usePermissions } from '@/hooks/usePermissions';
import type { Item } from '@/store/api/itemApi';
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@heroui/react';
import { ITEM_PERMISSIONS } from '@supplysense/types';
import { useMemo } from 'react';

interface ActionsDropdownProps {
  item: Item;
  onViewDetails: (itemId: string) => void;
  onEdit: (item: Item) => void;
  onDelete: (item: Item, deleteType: 'soft' | 'hard') => void;
}

export function ActionsDropdown({ item, onViewDetails, onEdit, onDelete }: ActionsDropdownProps) {
  const { hasPermission } = usePermissions();

  const actions = useMemo(() => {
    const actionsList = [
      {
        key: 'view',
        label: 'View Details',
        icon: <EyeIcon className="w-4 h-4" />,
        onPress: () => onViewDetails(item.id),
        className: '',
      },
    ];

    if (hasPermission(ITEM_PERMISSIONS.UPDATE)) {
      actionsList.push({
        key: 'edit',
        label: 'Edit',
        icon: <EditIcon className="w-4 h-4" />,
        onPress: () => onEdit(item),
        className: '',
      });

      actionsList.push({
        key: 'deactivate',
        label: item.isActive ? 'Deactivate' : 'Activate',
        icon: <BanIcon className="w-4 h-4" />,
        onPress: () => onDelete(item, 'soft'),
        className: 'text-warning',
      });
    }

    if (hasPermission(ITEM_PERMISSIONS.DELETE)) {
      actionsList.push({
        key: 'delete',
        label: 'Delete Permanently',
        icon: <TrashIcon className="w-4 h-4" />,
        onPress: () => onDelete(item, 'hard'),
        className: 'text-danger',
      });
    }

    return actionsList;
  }, [hasPermission, item, onViewDetails, onEdit, onDelete]);

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button isIconOnly size="sm" variant="light" aria-label="Actions">
          <DotsVerticalIcon className="w-4 h-4" />
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label="Item actions">
        {actions.map((action) => (
          <DropdownItem
            key={action.key}
            startContent={action.icon}
            onPress={action.onPress}
            className={action.className}
          >
            {action.label}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}
