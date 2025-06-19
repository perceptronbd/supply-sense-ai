import { ActionsDropdown } from '@/components/branches';
import { DrawingLogo } from '@/components/ui/DrawingLogo';
import { Text } from '@/components/ui/Text';
import type { Branch } from '@/store/api/branchApi';
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
import { AddressCell, ContactCell, ManagerCell, NameCell } from './BranchCells';
import { StatusChip } from './StatusChip';

interface BranchesTableProps {
  branches: Branch[];
  isLoading: boolean;
  error: unknown;
  columns: Array<{ name: string; uid: string; sortable: boolean }>;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  onRefetch: () => void;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  onViewBranch: (id: string) => void;
  onEditBranch: (branch: Branch) => void;
  onDeleteBranch: (branch: Branch, type?: 'soft' | 'hard') => void;
}

export function BranchesTable({
  branches,
  isLoading,
  error,
  columns,
  currentPage,
  itemsPerPage,
  totalPages,
  pagination,
  onRefetch,
  onPageChange,
  onItemsPerPageChange,
  onViewBranch,
  onEditBranch,
  onDeleteBranch,
}: BranchesTableProps) {
  const renderCell = (branch: Branch, columnKey: string) => {
    switch (columnKey) {
      case 'name':
        return <NameCell branch={branch} />;
      case 'contact':
        return <ContactCell branch={branch} />;
      case 'address':
        return <AddressCell branch={branch} />;
      case 'manager':
        return <ManagerCell branch={branch} />;
      case 'status':
        return <StatusChip isActive={branch.isActive} />;
      case 'actions':
        return (
          <ActionsDropdown
            branch={branch}
            onViewDetails={onViewBranch}
            onEdit={onEditBranch}
            onDelete={onDeleteBranch}
          />
        );
      default:
        return null;
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <DrawingLogo size={60} variant="primary" speed="fast" showFill={true} />
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <Text variant="bodyBase" color="danger" className="mb-2">
            Failed to load branches
          </Text>
          <Button variant="light" onPress={onRefetch}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Empty State
  if (!Array.isArray(branches) || branches.length === 0) {
    return (
      <div className="text-center py-8">
        <Text variant="bodyLarge" className="text-default-400">
          No branches found
        </Text>
      </div>
    );
  }

  // Table Content
  return (
    <>
      <Table
        aria-label="Branches table"
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
        <TableBody items={branches}>
          {(branch) => (
            <TableRow key={branch.id}>
              {(columnKey) => <TableCell>{renderCell(branch, columnKey as string)}</TableCell>}
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-divider">
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
                onItemsPerPageChange(newItemsPerPage);
              }}
            >
              <SelectItem key="10">10</SelectItem>
              <SelectItem key="25">25</SelectItem>
              <SelectItem key="50">50</SelectItem>
            </Select>
            <Text variant="bodySmall" className="text-default-400">
              {pagination && (
                <>
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, pagination.total)} of {pagination.total}{' '}
                  branches
                </>
              )}
            </Text>
          </div>
          <Pagination
            isCompact
            showControls
            showShadow
            color="primary"
            page={currentPage}
            total={totalPages}
            onChange={onPageChange}
          />
        </div>
      )}
    </>
  );
}
