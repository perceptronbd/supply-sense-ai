import { type Branch, useGetBranchesQuery } from '@/store/api/branchApi';
import { useCallback, useEffect, useState } from 'react';

export function useBranchesState() {
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

  // Ensure branches is always an array
  const branches = Array.isArray(branchesResponse?.data) ? branchesResponse.data : [];
  const pagination = branchesResponse?.pagination;

  // Action handlers
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleIncludeInactiveChange = useCallback((checked: boolean) => {
    setIncludeInactive(checked);
    setCurrentPage(1);
  }, []);

  const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  }, []);

  const handleDeleteBranch = useCallback((branch: Branch, type: 'soft' | 'hard' = 'soft') => {
    setSelectedBranch(branch);
    setDeleteType(type);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setSelectedBranch(null);
  }, []);
  return {
    // State
    isMounted,
    searchTerm,
    currentPage,
    itemsPerPage,
    includeInactive,
    isDeleteDialogOpen,
    selectedBranch,
    deleteType,

    // API Data
    branches,
    pagination,
    isLoading,
    error,
    refetch,

    // Setters
    setCurrentPage,
    setItemsPerPage,
    setIsDeleteDialogOpen,
    setSelectedBranch,

    // Handlers
    handleSearchChange,
    handlePageChange,
    handleIncludeInactiveChange,
    handleItemsPerPageChange,
    handleDeleteBranch,
    handleCloseDeleteDialog,
  };
}
