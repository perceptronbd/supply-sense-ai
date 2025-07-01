'use client';

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Checkbox,
  Chip,
  Input,
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
import { useEffect, useState } from 'react';

import AuthGuard from '@/components/AuthGuard';
import { ActionsDropdown } from '@/components/branches';
import { SearchIcon } from '@/components/icons';
import { DrawingLogo } from '@/components/ui/DrawingLogo';
import { PermissionGuard } from '@/components/ui/PermissionGuard';
import { Text } from '@/components/ui/Text';
import type { Branch } from '@/store/api/branchApi';
import { BRANCH_PERMISSIONS } from '@supplysense/types';

import { AddressCell, ContactCell, ManagerCell, NameCell } from './components/BranchCells';
import { DeleteModal } from './components/DeleteModal';
import { StatusChip } from './components/StatusChip';
import { useBranchActions } from './hooks/useBranchActions';
import { useBranchesState } from './hooks/useBranchesState';

export default function BranchesPage() {
  const [isMounted, setIsMounted] = useState(false);

  // Use extracted hooks for state management
  const state = useBranchesState();
  const actions = useBranchActions();

  // Ensure component is mounted before rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Helper function to render cells (extracted from main component)
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
            onViewDetails={actions.handleViewBranch}
            onEdit={actions.handleEditBranch}
            onDelete={state.handleDeleteBranch}
          />
        );
      default:
        return null;
    }
  };

  // Table columns definition
  const columns = [
    { name: 'NAME', uid: 'name', sortable: true },
    { name: 'CONTACT', uid: 'contact', sortable: false },
    { name: 'ADDRESS', uid: 'address', sortable: false },
    { name: 'MANAGER', uid: 'manager', sortable: false },
    { name: 'STATUS', uid: 'status', sortable: true },
    { name: 'ACTIONS', uid: 'actions', sortable: false },
  ];

  // Helper to handle confirm delete
  const handleConfirmDelete = () => {
    actions.handleConfirmDelete(
      state.selectedBranch,
      state.deleteType,
      state.handleCloseDeleteDialog
    );
  };

  // Loading state before mount
  if (!isMounted) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="p-6">
          <div className="mx-auto max-w-7xl">
            <div className="flex justify-center items-center h-64">
              <DrawingLogo size={60} variant="primary" speed="fast" showFill={true} />
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  const totalPages = state.pagination?.pages || 1;

  return (
    <AuthGuard requireAuth={true}>
      <main className="p-6">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <header className="flex justify-between items-center mb-6">
            <div>
              <Text variant="headerSmall" weight="bold" color="default" as="h1">
                Branches
              </Text>
              <Text variant="bodyBase" color="muted" className="mt-2" as="p">
                Manage company branches and locations
              </Text>
            </div>
            <PermissionGuard permission={BRANCH_PERMISSIONS.CREATE}>
              <Button
                color="primary"
                onPress={actions.handleCreateBranch}
                startContent={
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                }
              >
                Add Branch
              </Button>
            </PermissionGuard>
          </header>

          {/* Main Content */}
          <section>
            <Card>
              <CardHeader className="flex flex-col gap-4 pb-3">
                <div className="flex justify-between items-center w-full">
                  <Text variant="titleSmall" weight="semiBold" as="h2">
                    All Branches
                  </Text>
                  {/* Status Summary */}
                  <div className="flex flex-wrap gap-2 justify-end">
                    <Chip color="primary" variant="flat" size="sm">
                      Total: {state.pagination?.total || state.branches.length}
                    </Chip>
                    <Chip color="success" variant="flat" size="sm">
                      Active: {state.branches.filter((branch) => branch.isActive).length}
                    </Chip>
                    <Chip color="default" variant="flat" size="sm">
                      Inactive: {state.branches.filter((branch) => !branch.isActive).length}
                    </Chip>
                  </div>
                </div>
                {/* Search and Filters */}
                <div className="flex flex-col gap-4 justify-start w-full sm:flex-row">
                  <Input
                    placeholder="Search branches by name or code..."
                    value={state.searchTerm}
                    onValueChange={state.handleSearchChange}
                    startContent={<SearchIcon className="w-4 h-4 text-default-400" />}
                    className="w-full sm:w-96"
                    variant="bordered"
                  />
                  <div className="flex gap-4 items-center">
                    <Checkbox
                      isSelected={state.includeInactive}
                      onValueChange={state.handleIncludeInactiveChange}
                      size="sm"
                    >
                      Include inactive
                    </Checkbox>
                  </div>
                </div>
              </CardHeader>

              <CardBody>
                {/* Loading State */}
                {state.isLoading && (
                  <div className="flex justify-center items-center py-12">
                    <DrawingLogo size={60} variant="primary" speed="fast" showFill={true} />
                  </div>
                )}

                {/* Error State */}
                {state.error && (
                  <div className="flex justify-center items-center py-12">
                    <div className="text-center">
                      <Text variant="bodyBase" color="danger" className="mb-2">
                        Failed to load branches
                      </Text>
                      <Button variant="light" onPress={() => state.refetch()}>
                        Try Again
                      </Button>
                    </div>
                  </div>
                )}

                {/* Table */}
                {!state.isLoading && !state.error && state.branches.length > 0 && (
                  <>
                    <Table aria-label="Branches table">
                      <TableHeader columns={columns}>
                        {(column) => (
                          <TableColumn key={column.uid} allowsSorting={column.sortable}>
                            {column.name}
                          </TableColumn>
                        )}
                      </TableHeader>
                      <TableBody items={state.branches}>
                        {(branch) => (
                          <TableRow key={branch.id}>
                            {(columnKey) => (
                              <TableCell>{renderCell(branch, columnKey as string)}</TableCell>
                            )}
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex justify-between items-center pt-4 mt-6 border-t border-divider">
                        <div className="flex gap-4 items-center">
                          <Select
                            size="sm"
                            placeholder="Items per page"
                            defaultSelectedKeys={[state.itemsPerPage.toString()]}
                            className="w-32"
                            onChange={(e) =>
                              state.handleItemsPerPageChange(Number.parseInt(e.target.value))
                            }
                          >
                            <SelectItem key="10">10</SelectItem>
                            <SelectItem key="25">25</SelectItem>
                            <SelectItem key="50">50</SelectItem>
                          </Select>
                          <Text variant="bodySmall" className="text-default-400">
                            {state.pagination && (
                              <>
                                Showing {(state.currentPage - 1) * state.itemsPerPage + 1} to{' '}
                                {Math.min(
                                  state.currentPage * state.itemsPerPage,
                                  state.pagination.total
                                )}{' '}
                                of {state.pagination.total} branches
                              </>
                            )}
                          </Text>
                        </div>
                        <Pagination
                          isCompact
                          showControls
                          showShadow
                          color="primary"
                          page={state.currentPage}
                          total={totalPages}
                          onChange={state.handlePageChange}
                        />
                      </div>
                    )}
                  </>
                )}

                {/* Empty State */}
                {!state.isLoading && !state.error && state.branches.length === 0 && (
                  <div className="py-8 text-center">
                    <Text variant="bodyLarge" className="text-default-400">
                      No branches found
                    </Text>
                  </div>
                )}
              </CardBody>
            </Card>
          </section>
        </div>

        {/* Delete Modal */}
        <DeleteModal
          isOpen={state.isDeleteDialogOpen}
          selectedBranch={state.selectedBranch}
          deleteType={state.deleteType}
          isDeleting={actions.isDeleting}
          isHardDeleting={actions.isHardDeleting}
          onConfirm={handleConfirmDelete}
          onClose={state.handleCloseDeleteDialog}
        />
      </main>
    </AuthGuard>
  );
}
