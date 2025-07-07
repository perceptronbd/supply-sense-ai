'use client';

import {
  type Supplier,
  useDeleteSupplierMutation,
  useGetSuppliersQuery,
  useHardDeleteSupplierMutation,
} from '@/store/api/supplierApi';
import { addToast } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export function useSuppliersPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  // State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);

  // Dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [deleteType, setDeleteType] = useState<'soft' | 'hard'>('soft');

  // Ensure component is mounted before rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // API query
  const queryResult = useGetSuppliersQuery(
    {
      search: searchTerm || undefined,
      page: currentPage,
      limit: itemsPerPage,
      includeInactive,
    },
    { skip: !isMounted }
  );

  // Mutations
  const [deleteSupplier, { isLoading: isDeleting }] = useDeleteSupplierMutation();
  const [hardDeleteSupplier, { isLoading: isHardDeleting }] = useHardDeleteSupplierMutation();

  // Ensure suppliers is always an array
  const suppliers = Array.isArray(queryResult.data?.data) ? queryResult.data.data : [];
  const pagination = queryResult.data?.pagination;

  // Handle search with debouncing
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  }, []);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Handle items per page change
  const handleItemsPerPageChange = useCallback((value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1); // Reset to first page when changing items per page
  }, []);

  // Handle include inactive toggle
  const handleIncludeInactiveChange = useCallback((checked: boolean) => {
    setIncludeInactive(checked);
    setCurrentPage(1); // Reset to first page when changing filter
  }, []);

  // Handle navigation to supplier details
  const handleViewDetails = useCallback(
    (supplierId: string) => {
      router.push(`/suppliers/${supplierId}`);
    },
    [router]
  );

  // Handle edit supplier
  const handleEditSupplier = useCallback(
    (supplier: Supplier) => {
      router.push(`/suppliers/${supplier.id}/edit`);
    },
    [router]
  );

  // Handle delete supplier
  const handleDeleteSupplier = useCallback((supplier: Supplier, deleteType: 'soft' | 'hard') => {
    setSelectedSupplier(supplier);
    setDeleteType(deleteType);
    setIsDeleteDialogOpen(true);
  }, []);

  // Handle create new supplier
  const handleCreateSupplier = useCallback(() => {
    router.push('/suppliers/create');
  }, [router]);

  // Extract delete confirmation logic
  const executeDeleteAction = async (supplier: Supplier, type: 'soft' | 'hard') => {
    if (type === 'hard') {
      await hardDeleteSupplier(supplier.id).unwrap();
      return `Supplier "${supplier.name}" has been permanently deleted.`;
    }

    await deleteSupplier(supplier.id).unwrap();
    return `Supplier "${supplier.name}" has been deactivated.`;
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!selectedSupplier) return;

    try {
      const message = await executeDeleteAction(selectedSupplier, deleteType);
      addToast({
        title: deleteType === 'hard' ? 'Supplier Deleted' : 'Supplier Deactivated',
        description: message,
        color: 'success',
        variant: 'flat',
      });
    } catch (err) {
      console.error('Delete supplier error:', err);
      addToast({
        title: 'Error',
        description: `Failed to ${deleteType === 'hard' ? 'delete' : 'deactivate'} supplier.`,
        color: 'danger',
        variant: 'flat',
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedSupplier(null);
    }
  };

  // Handle dialog close
  const handleDialogClose = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setSelectedSupplier(null);
  }, []);

  return {
    // State
    isMounted,
    currentPage,
    itemsPerPage,
    searchTerm,
    includeInactive,
    isDeleteDialogOpen,
    selectedSupplier,
    deleteType,

    // Data
    suppliers,
    pagination,
    isLoading: queryResult.isLoading,
    error: queryResult.error,
    refetch: queryResult.refetch,
    isDeleting,
    isHardDeleting,

    // Handlers
    handleSearchChange,
    handlePageChange,
    handleItemsPerPageChange,
    handleIncludeInactiveChange,
    handleViewDetails,
    handleEditSupplier,
    handleDeleteSupplier,
    handleCreateSupplier,
    handleConfirmDelete,
    handleDialogClose,
  };
}
