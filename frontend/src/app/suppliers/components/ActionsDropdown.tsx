import { DotsVerticalIcon, EditIcon, EyeIcon, TrashIcon } from '@/components/icons';
import { type Supplier } from '@/store/api/supplierApi';
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@heroui/react';

interface ActionsDropdownProps {
  supplier: Supplier;
  onViewDetails: (id: string) => void;
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier, deleteType: 'soft' | 'hard') => void;
}

export function ActionsDropdown({
  supplier,
  onViewDetails,
  onEdit,
  onDelete,
}: ActionsDropdownProps) {
  return (
    <div className="flex justify-center">
      <Dropdown>
        <DropdownTrigger>
          <Button
            variant="light"
            size="sm"
            isIconOnly
            className="text-default-600 hover:text-default-600"
          >
            <DotsVerticalIcon />
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          variant="flat"
          onAction={(key) => {
            const action = key as string;
            if (action === 'view') {
              onViewDetails(supplier.id);
            } else if (action === 'edit') {
              onEdit(supplier);
            } else if (action === 'delete') {
              onDelete(supplier, 'soft');
            } else if (action === 'hardDelete') {
              onDelete(supplier, 'hard');
            }
          }}
        >
          <DropdownItem key="view" startContent={<EyeIcon />}>
            View Details
          </DropdownItem>
          <DropdownItem key="edit" startContent={<EditIcon />}>
            Edit
          </DropdownItem>
          <DropdownItem key="delete" color="danger" startContent={<TrashIcon />}>
            Deactivate
          </DropdownItem>
          <DropdownItem key="hardDelete" color="danger" startContent={<TrashIcon />}>
            Delete Permanently
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </div>
  );
}
