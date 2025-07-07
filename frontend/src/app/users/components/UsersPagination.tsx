'use client';

// 2. External library imports
import { Button, Pagination } from '@heroui/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// 3. Internal alias imports - Components
import { Text } from '@/components/ui/Text';

interface UsersPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export function UsersPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: UsersPaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <nav
      className="flex items-center justify-between p-4 border rounded-lg bg-content1 border-divider"
      aria-label="Users pagination"
    >
      {/* Results info */}
      <div className="flex items-center gap-2">
        <Text variant="bodySmall" color="muted">
          Showing {startItem} to {endItem} of {totalItems} users
        </Text>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-2">
        <Button
          isIconOnly
          size="sm"
          variant="flat"
          isDisabled={currentPage <= 1}
          onPress={() => onPageChange(currentPage - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <Pagination
          total={totalPages}
          page={currentPage}
          onChange={onPageChange}
          size="sm"
          showControls={false}
          className="gap-1"
        />

        <Button
          isIconOnly
          size="sm"
          variant="flat"
          isDisabled={currentPage >= totalPages}
          onPress={() => onPageChange(currentPage + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </nav>
  );
}
