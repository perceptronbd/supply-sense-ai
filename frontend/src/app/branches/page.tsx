'use client';

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Checkbox,
  Chip,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Pagination,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  addToast,
} from '@heroui/react';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import AuthGuard from '@/components/AuthGuard';
import { ActionsDropdown } from '@/components/branches';
import { SearchIcon } from '@/components/icons';
import { StatusChip } from '@/components/items/StatusChip';
import { DrawingLogo } from '@/components/ui/DrawingLogo';
import { Text } from '@/components/ui/Text';
import {
  type Branch,
  useDeleteBranchMutation,
  useGetBranchesQuery,
  useHardDeleteBranchMutation,
} from '@/store/api/branchApi';

// Helper components to reduce complexity
const NameCell = ({ branch }: { branch: Branch }) => (
  <div className="flex flex-col">
    <Text variant="bodyBase" className="font-medium">
      {branch.name}
    </Text>
    <Text variant="bodySmall" className="text-default-500">
      Code: {branch.code}
    </Text>
  </div>
);

const ContactCell = ({ branch }: { branch: Branch }) => (
  <div className="flex flex-col">
    {branch.email && <Text variant="bodySmall">{branch.email}</Text>}
    {branch.phone && (
      <Text variant="bodySmall" className="text-default-500">
        {branch.phone}
      </Text>
    )}
    {!branch.email && !branch.phone && (
      <Text variant="bodySmall" className="text-default-400">
        No contact info
      </Text>
    )}
  </div>
);

const AddressCell = ({ branch }: { branch: Branch }) =>
  branch.address ? (
    <Text variant="bodySmall">{branch.address}</Text>
  ) : (
    <Text variant="bodySmall" className="text-default-400">
      No address
    </Text>
  );

const ManagerCell = ({ branch }: { branch: Branch }) =>
  branch.manager ? (
    <div className="flex flex-col">
      <Text variant="bodySmall" className="font-medium">
        {branch.manager.firstName} {branch.manager.lastName}
      </Text>
      <Text variant="bodySmall" className="text-default-500">
        {branch.manager.email}
      </Text>
    </div>
  ) : (
    <Text variant="bodySmall" className="text-default-400">
      No manager assigned
    </Text>
  );

export default function BranchesPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  // Filter and pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [includeInactive, setIncludeInactive] = useState(false);

  // Dialog state (only for delete confirmation)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [deleteType, setDeleteType] = useState<'soft' | 'hard'>('soft');

  // Ensure component is mounted before rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // API calls
  const {
    data: branchesResponse,
    isLoading,
    error,
    refetch,
  } = useGetBranchesQuery(
    {
      search: searchTerm || undefined,
      page: currentPage,
      limit: itemsPerPage,
      includeInactive,
    },
    { skip: !isMounted }
  );

  const [deleteBranch, { isLoading: isDeleting }] = useDeleteBranchMutation();
  const [hardDeleteBranch, { isLoading: isHardDeleting }] = useHardDeleteBranchMutation();

  // Ensure branches is always an array, with detailed debugging
  const branches = Array.isArray(branchesResponse?.data) ? branchesResponse.data : [];
  const pagination = branchesResponse?.pagination;

  // Enhanced debug logging to see what we're actually getting
  console.log('=== BRANCHES DEBUG ===');
  console.log('branchesResponse:', branchesResponse);
  console.log('branchesResponse?.data:', branchesResponse?.data);
  console.log('branchesResponse?.data type:', typeof branchesResponse?.data);
  console.log('branchesResponse?.data isArray:', Array.isArray(branchesResponse?.data));
  console.log('final branches:', branches);
  console.log('final branches isArray:', Array.isArray(branches));
  console.log('branches length:', branches.length);
  console.log('=== END DEBUG ===');
  const totalPages = pagination?.pages || 1;
  // Action handlers
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  // Handle search with debouncing (alias for consistency)
  const handleSearch = handleSearchChange;

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleIncludeInactiveChange = useCallback((checked: boolean) => {
    setIncludeInactive(checked);
    setCurrentPage(1);
  }, []);

  const handleCreateBranch = useCallback(() => {
    router.push('/branches/create');
  }, [router]);

  const handleViewBranch = useCallback(
    (branchId: string) => {
      router.push(`/branches/${branchId}`);
    },
    [router]
  );

  const handleEditBranch = useCallback(
    (branch: Branch) => {
      router.push(`/branches/${branch.id}/edit`);
    },
    [router]
  );

  const handleDeleteBranch = useCallback((branch: Branch, type: 'soft' | 'hard' = 'soft') => {
    setSelectedBranch(branch);
    setDeleteType(type);
    setIsDeleteDialogOpen(true);
  }, []);
  const handleConfirmDelete = useCallback(async () => {
    if (!selectedBranch) return;

    try {
      if (deleteType === 'hard') {
        await hardDeleteBranch(selectedBranch.id).unwrap();
        addToast({
          title: 'Success',
          description: 'Branch deleted permanently',
          color: 'success',
          variant: 'flat',
        });
      } else {
        await deleteBranch(selectedBranch.id).unwrap();
        addToast({
          title: 'Success',
          description: `Branch ${
            selectedBranch.isActive ? 'deactivated' : 'activated'
          } successfully`,
          color: 'success',
          variant: 'flat',
        });
      }
      setIsDeleteDialogOpen(false);
      setSelectedBranch(null);
    } catch (error) {
      console.error('Failed to delete branch:', error);
      addToast({
        title: 'Error',
        description: 'Failed to update branch',
        color: 'danger',
        variant: 'flat',
      });
    }
  }, [selectedBranch, deleteType, deleteBranch, hardDeleteBranch]);

  const handleCloseDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setSelectedBranch(null);
  }, []);

  // Render cell content
  const renderCell = useCallback(
    (branch: Branch, columnKey: string) => {
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
              onViewDetails={handleViewBranch}
              onEdit={handleEditBranch}
              onDelete={handleDeleteBranch}
            />
          );
        default:
          return null;
      }
    },
    [handleViewBranch, handleEditBranch, handleDeleteBranch]
  );
  const columns = useMemo(
    () => [
      { name: 'NAME', uid: 'name', sortable: true },
      { name: 'CONTACT', uid: 'contact', sortable: false },
      { name: 'ADDRESS', uid: 'address', sortable: false },
      { name: 'MANAGER', uid: 'manager', sortable: false },
      { name: 'STATUS', uid: 'status', sortable: true },
      { name: 'ACTIONS', uid: 'actions', sortable: false },
    ],
    []
  );

  // Don't render anything until mounted
  if (!isMounted) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center items-center h-64">
              <DrawingLogo size={60} variant="primary" speed="fast" showFill={true} />
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requireAuth={true}>
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
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
            <Button
              color="primary"
              onPress={handleCreateBranch}
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
          </header>

          {/* Branches Table and Filters */}
          <section>
            <Card>
              <CardHeader className="pb-3 flex flex-col gap-4">
                <div className="flex justify-between items-center w-full">
                  <Text variant="titleSmall" weight="semiBold" as="h2">
                    All Branches
                  </Text>
                  {/* Status Summary Chips */}
                  <div className="flex flex-wrap gap-2 justify-end">
                    <Chip
                      color="primary"
                      variant="flat"
                      size="sm"
                      startContent={<div className="bg-primary rounded-full w-1.5 h-1.5" />}
                    >
                      Total: {pagination?.total || (Array.isArray(branches) ? branches.length : 0)}
                    </Chip>
                    <Chip
                      color="success"
                      variant="flat"
                      size="sm"
                      startContent={<div className="bg-success rounded-full w-1.5 h-1.5" />}
                    >
                      Active:{' '}
                      {Array.isArray(branches)
                        ? branches.filter((branch) => branch.isActive).length
                        : 0}
                    </Chip>
                    <Chip
                      color="default"
                      variant="flat"
                      size="sm"
                      startContent={<div className="bg-default-500 rounded-full w-1.5 h-1.5" />}
                    >
                      Inactive:{' '}
                      {Array.isArray(branches)
                        ? branches.filter((branch) => !branch.isActive).length
                        : 0}
                    </Chip>
                  </div>
                </div>
                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-4 justify-start w-full">
                  <Input
                    placeholder="Search branches by name or code..."
                    value={searchTerm}
                    onValueChange={handleSearch}
                    startContent={<SearchIcon className="w-4 h-4 text-default-400" />}
                    className="w-full sm:w-96"
                    variant="bordered"
                  />
                  <div className="flex items-center gap-4">
                    <Checkbox
                      isSelected={includeInactive}
                      onValueChange={handleIncludeInactiveChange}
                      size="sm"
                    >
                      Include inactive
                    </Checkbox>
                  </div>
                </div>
              </CardHeader>

              <CardBody>
                {/* Loading State */}
                {isLoading && (
                  <div className="flex justify-center items-center py-12">
                    <DrawingLogo size={60} variant="primary" speed="fast" showFill={true} />
                  </div>
                )}
                {/* Error State */}
                {error && (
                  <div className="flex justify-center items-center py-12">
                    <div className="text-center">
                      <Text variant="bodyBase" color="danger" className="mb-2">
                        Failed to load branches
                      </Text>
                      <Button variant="light" onPress={() => refetch()}>
                        Try Again
                      </Button>
                    </div>
                  </div>
                )}
                {/* Table */}
                {!isLoading && !error && Array.isArray(branches) && branches.length > 0 && (
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
                            {(columnKey) => (
                              <TableCell>{renderCell(branch, columnKey as string)}</TableCell>
                            )}
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
                              setItemsPerPage(newItemsPerPage);
                              setCurrentPage(1);
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
                                {Math.min(currentPage * itemsPerPage, pagination.total)} of{' '}
                                {pagination.total} branches
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
                          onChange={handlePageChange}
                        />
                      </div>
                    )}
                  </>
                )}
                {!isLoading && !error && (!Array.isArray(branches) || branches.length === 0) && (
                  <div className="text-center py-8">
                    <Text variant="bodyLarge" className="text-default-400">
                      No branches found
                    </Text>
                  </div>
                )}
              </CardBody>
            </Card>
          </section>
        </div>

        <Modal isOpen={isDeleteDialogOpen} onClose={handleCloseDeleteDialog} placement="center">
          <ModalContent>
            <ModalHeader className="flex flex-col gap-1">
              <Text variant="titleMedium">
                {deleteType === 'hard'
                  ? 'Delete Branch Permanently'
                  : selectedBranch?.isActive
                    ? 'Deactivate Branch'
                    : 'Activate Branch'}
              </Text>
            </ModalHeader>
            <ModalBody>
              <Text variant="bodyBase">
                {deleteType === 'hard'
                  ? `Are you sure you want to permanently delete "${selectedBranch?.name}"? This action cannot be undone.`
                  : selectedBranch?.isActive
                    ? `Are you sure you want to deactivate "${selectedBranch?.name}"?`
                    : `Are you sure you want to activate "${selectedBranch?.name}"?`}
              </Text>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="light"
                onPress={handleCloseDeleteDialog}
                isDisabled={isDeleting || isHardDeleting}
              >
                Cancel
              </Button>
              <Button
                color={deleteType === 'hard' ? 'danger' : 'warning'}
                onPress={handleConfirmDelete}
                isLoading={isDeleting || isHardDeleting}
              >
                {deleteType === 'hard'
                  ? 'Delete Permanently'
                  : selectedBranch?.isActive
                    ? 'Deactivate'
                    : 'Activate'}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </main>
    </AuthGuard>
  );
}
