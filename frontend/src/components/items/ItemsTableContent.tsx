'use client';

import { DrawingLogo } from '@/components/ui/DrawingLogo';
import { Text } from '@/components/ui/Text';
import { type Item } from '@/store/api/itemApi';
import {
  Button,
  Pagination,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';

interface ItemsTableContentProps {
  isLoading: boolean;
  error: unknown;
  items: Item[];
  searchTerm: string;
  columns: Array<{ name: string; uid: string; sortable: boolean }>;
  renderCell: (item: Item, columnKey: string) => React.ReactNode;
  pagination?: {
    page: number;
    pages: number;
    limit: number;
    total: number;
  };
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (value: string) => void;
  onRefetch: () => void;
}

export function ItemsTableContent({
  isLoading,
  error,
  items,
  searchTerm,
  columns,
  renderCell,
  pagination,
  currentPage,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  onRefetch,
}: ItemsTableContentProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <DrawingLogo size={60} variant="primary" speed="fast" showFill={true} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <Text variant="bodyLarge" color="danger" className="mb-4">
          Failed to load items
        </Text>
        <Button color="primary" variant="flat" onPress={onRefetch}>
          Try Again
        </Button>
      </div>
    );
  }

  if (!Array.isArray(items) || items.length === 0) {
    return (
      <div className="py-12 text-center border-2 border-dashed rounded-lg border-divider">
        <Text variant="bodyLarge" color="muted" className="mb-2">
          {searchTerm ? 'No items found matching your search' : 'No items found'}
        </Text>
        {searchTerm && (
          <Text variant="bodyMedium" color="muted">
            Try adjusting your search criteria
          </Text>
        )}
      </div>
    );
  }

  return (
    <>
      <Table
        aria-label="Items table"
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
        <TableBody items={items}>
          {(item) => (
            <TableRow key={item.id}>
              {(columnKey) => <TableCell>{renderCell(item, columnKey as string)}</TableCell>}
            </TableRow>
          )}
        </TableBody>
      </Table>
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between pt-4 mt-6 border-t border-divider">
          <div className="flex items-center gap-4">
            <Select
              size="sm"
              placeholder="Items per page"
              defaultSelectedKeys={[itemsPerPage.toString()]}
              className="w-32"
              classNames={{
                popoverContent: 'bg-default-200',
                trigger: 'bg-default-200',
              }}
              onChange={(e) => {
                const newItemsPerPage = Number.parseInt(e.target.value);
                onItemsPerPageChange(newItemsPerPage.toString());
              }}
            >
              <SelectItem key="10">10</SelectItem>
              <SelectItem key="25">25</SelectItem>
              <SelectItem key="50">50</SelectItem>
              <SelectItem key="100">100</SelectItem>
            </Select>
            <Text variant="bodySmall" color="muted">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}{' '}
              items
            </Text>
          </div>
          <Pagination
            page={currentPage}
            total={pagination.pages}
            onChange={onPageChange}
            showControls
            color="primary"
          />
        </div>
      )}
    </>
  );
}
