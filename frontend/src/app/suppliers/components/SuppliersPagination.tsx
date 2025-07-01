import { Text } from '@/components/ui/Text';
import { Pagination, Select, SelectItem } from '@heroui/react';

interface SuppliersPaginationProps {
  currentPage: number;
  itemsPerPage: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | null;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (value: string) => void;
}

export function SuppliersPagination({
  currentPage,
  itemsPerPage,
  pagination,
  onPageChange,
  onItemsPerPageChange,
}: SuppliersPaginationProps) {
  if (!pagination || pagination.pages <= 1) {
    return null;
  }

  return (
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
          suppliers
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
  );
}
