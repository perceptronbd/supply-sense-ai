import { DrawingLogo } from '@/components/ui/DrawingLogo';
import { Text } from '@/components/ui/Text';
import { type Supplier } from '@/store/api/supplierApi';
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';
import { SupplierTableCell } from './SupplierTableCell';

interface SuppliersTableProps {
  suppliers: Supplier[];
  isLoading: boolean;
  error: unknown;
  searchTerm: string;
  onRefetch: () => void;
  onViewDetails: (id: string) => void;
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier, deleteType: 'soft' | 'hard') => void;
}

const columns = [
  { name: 'CODE', uid: 'code', sortable: true },
  { name: 'NAME', uid: 'name', sortable: true },
  { name: 'CONTACT PERSON', uid: 'contactPerson', sortable: true },
  { name: 'EMAIL', uid: 'email', sortable: false },
  { name: 'PHONE', uid: 'phone', sortable: false },
  { name: 'STATUS', uid: 'status', sortable: true },
  { name: 'ACTIONS', uid: 'actions', sortable: false },
];

export function SuppliersTable({
  suppliers,
  isLoading,
  error,
  searchTerm,
  onRefetch,
  onViewDetails,
  onEdit,
  onDelete,
}: SuppliersTableProps) {
  // Loading State
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <DrawingLogo size={60} variant="primary" speed="fast" showFill={true} />
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="py-12 text-center">
        <Text variant="bodyLarge" color="danger" className="mb-4">
          Failed to load suppliers
        </Text>
        <Button color="primary" variant="flat" onPress={onRefetch}>
          Try Again
        </Button>
      </div>
    );
  }

  // Empty State
  if (!Array.isArray(suppliers) || suppliers.length === 0) {
    return (
      <div className="py-12 text-center border-2 border-dashed rounded-lg border-divider">
        <Text variant="bodyLarge" color="muted" className="mb-2">
          {searchTerm ? 'No suppliers found matching your search' : 'No suppliers found'}
        </Text>
        {searchTerm && (
          <Text variant="bodyMedium" color="muted">
            Try adjusting your search criteria
          </Text>
        )}
      </div>
    );
  }

  // Suppliers Table
  return (
    <Table
      aria-label="Suppliers table"
      classNames={{
        th: 'bg-default-200',
        tr: 'hover:bg-default-200',
      }}
    >
      <TableHeader columns={columns}>
        {(column) => (
          <TableColumn key={column.uid} allowsSorting={column.sortable}>
            {column.name}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody items={suppliers}>
        {(supplier) => (
          <TableRow key={supplier.id}>
            {(columnKey) => (
              <TableCell>
                <SupplierTableCell
                  supplier={supplier}
                  columnKey={columnKey as string}
                  onViewDetails={onViewDetails}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </TableCell>
            )}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
