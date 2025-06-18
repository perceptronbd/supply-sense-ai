import { BanIcon, DotsVerticalIcon, EditIcon, EyeIcon, TrashIcon } from '@/components/icons';
import type { Item } from '@/store/api/itemApi';
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@heroui/react';

interface ActionsDropdownProps {
  item: Item;
  onViewDetails: (itemId: string) => void;
  onEdit: (item: Item) => void;
  onDelete: (item: Item, deleteType: 'soft' | 'hard') => void;
}

export function ActionsDropdown({ item, onViewDetails, onEdit, onDelete }: ActionsDropdownProps) {
  return (
    <Dropdown>
      <DropdownTrigger>
        <Button isIconOnly size="sm" variant="light" aria-label="Actions">
          <DotsVerticalIcon className="w-4 h-4" />
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label="Item actions">
        <DropdownItem
          key="view"
          startContent={<EyeIcon className="w-4 h-4" />}
          onPress={() => onViewDetails(item.id)}
        >
          View Details
        </DropdownItem>
        <DropdownItem
          key="edit"
          startContent={<EditIcon className="w-4 h-4" />}
          onPress={() => onEdit(item)}
        >
          Edit
        </DropdownItem>
        <DropdownItem
          key="deactivate"
          className="text-warning"
          color="warning"
          startContent={<BanIcon className="w-4 h-4" />}
          onPress={() => onDelete(item, 'soft')}
        >
          {item.isActive ? 'Deactivate' : 'Activate'}
        </DropdownItem>
        <DropdownItem
          key="delete"
          className="text-danger"
          color="danger"
          startContent={<TrashIcon className="w-4 h-4" />}
          onPress={() => onDelete(item, 'hard')}
        >
          Delete Permanently
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}
