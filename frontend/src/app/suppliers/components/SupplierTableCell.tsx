import { Text } from '@/components/ui/Text';
import { type Supplier } from '@/store/api/supplierApi';
import { Chip } from '@heroui/react';
import { useCallback } from 'react';
import { ActionsDropdown } from './ActionsDropdown';

interface SupplierTableCellProps {
  supplier: Supplier;
  columnKey: string;
  onViewDetails: (id: string) => void;
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier, deleteType: 'soft' | 'hard') => void;
}

export function SupplierTableCell({
  supplier,
  columnKey,
  onViewDetails,
  onEdit,
  onDelete,
}: SupplierTableCellProps) {
  const renderCell = useCallback(() => {
    switch (columnKey) {
      case 'code':
        return (
          <Text variant="bodyMedium" weight="medium" as="span">
            {supplier.code}
          </Text>
        );
      case 'name':
        return (
          <Text variant="bodyMedium" as="span">
            {supplier.name}
          </Text>
        );
      case 'contactPerson':
        return (
          <Text variant="bodyMedium" as="span">
            {supplier.contactPerson || '-'}
          </Text>
        );
      case 'email':
        return (
          <Text variant="bodyMedium" as="span">
            {supplier.email || '-'}
          </Text>
        );
      case 'phone':
        return (
          <Text variant="bodyMedium" as="span">
            {supplier.phone || '-'}
          </Text>
        );
      case 'status':
        return (
          <Chip color={supplier.isActive ? 'success' : 'default'} variant="flat" size="sm">
            {supplier.isActive ? 'Active' : 'Inactive'}
          </Chip>
        );
      case 'actions':
        return (
          <ActionsDropdown
            supplier={supplier}
            onViewDetails={onViewDetails}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        );
      default:
        return null;
    }
  }, [supplier, columnKey, onViewDetails, onEdit, onDelete]);

  return <>{renderCell()}</>;
}
