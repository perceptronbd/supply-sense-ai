import { DotsVerticalIcon, EyeIcon } from '@/components/icons';
import type { Item } from '@/store/api/itemApi';
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@heroui/react';

interface ActionsDropdownProps {
  item: Item;
  onViewDetails: (itemId: string) => void;
}

export function ActionsDropdown({ item, onViewDetails }: ActionsDropdownProps) {
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
      </DropdownMenu>
    </Dropdown>
  );
}
