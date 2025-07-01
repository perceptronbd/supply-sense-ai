'use client';

import AuthGuard from '@/components/AuthGuard';
import { PlusIcon } from '@/components/icons';
import { DrawingLogo } from '@/components/ui/DrawingLogo';
import { PermissionGuard } from '@/components/ui/PermissionGuard';
import { Text } from '@/components/ui/Text';
import { Button, Card, CardBody, CardHeader } from '@heroui/react';
import { SUPPLIER_PERMISSIONS } from '@supplysense/types';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';
import { SuppliersFilters } from './components/SuppliersFilters';
import { SuppliersPagination } from './components/SuppliersPagination';
import { SuppliersTable } from './components/SuppliersTable';
import { useSuppliersPage } from './hooks/useSuppliersPage';

function LoadingState() {
  return (
    <AuthGuard requireAuth={true}>
      <main className="p-6 bg-background min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <DrawingLogo size={60} variant="primary" speed="fast" showFill={true} />
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}

export default function SuppliersPage() {
  const {
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
    isLoading,
    error,
    refetch,
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
  } = useSuppliersPage();

  // Don't render anything until mounted
  if (!isMounted) {
    return <LoadingState />;
  }

  const totalCount = pagination?.total || (Array.isArray(suppliers) ? suppliers.length : 0);
  const activeCount = Array.isArray(suppliers)
    ? suppliers.filter((supplier) => supplier.isActive).length
    : 0;
  const inactiveCount = Array.isArray(suppliers)
    ? suppliers.filter((supplier) => !supplier.isActive).length
    : 0;

  return (
    <AuthGuard requireAuth={true}>
      <main className="p-6">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <header className="flex items-center justify-between mb-6">
            <div>
              <Text variant="headerSmall" weight="bold" color="default" as="h1">
                Suppliers
              </Text>
              <Text variant="bodyBase" color="muted" className="mt-2" as="p">
                Manage your suppliers and vendor relationships
              </Text>
            </div>
            <PermissionGuard permission={SUPPLIER_PERMISSIONS.CREATE}>
              <Button color="primary" onPress={handleCreateSupplier} startContent={<PlusIcon />}>
                Add Supplier
              </Button>
            </PermissionGuard>
          </header>

          {/* Suppliers Table and Filters */}
          <section>
            <Card as="article">
              <CardHeader className="flex flex-col gap-4 pb-3">
                <SuppliersFilters
                  searchTerm={searchTerm}
                  includeInactive={includeInactive}
                  onSearchChange={handleSearchChange}
                  onIncludeInactiveChange={handleIncludeInactiveChange}
                  totalCount={totalCount}
                  activeCount={activeCount}
                  inactiveCount={inactiveCount}
                />
              </CardHeader>

              <CardBody>
                <SuppliersTable
                  suppliers={suppliers}
                  isLoading={isLoading}
                  error={error}
                  searchTerm={searchTerm}
                  onRefetch={refetch}
                  onViewDetails={handleViewDetails}
                  onEdit={handleEditSupplier}
                  onDelete={handleDeleteSupplier}
                />

                {/* Show pagination if there are suppliers */}
                {!isLoading && !error && Array.isArray(suppliers) && suppliers.length > 0 && (
                  <SuppliersPagination
                    currentPage={currentPage}
                    itemsPerPage={itemsPerPage}
                    pagination={pagination || null}
                    onPageChange={handlePageChange}
                    onItemsPerPageChange={handleItemsPerPageChange}
                  />
                )}
              </CardBody>
            </Card>
          </section>

          {/* Delete Confirmation Modal */}
          <DeleteConfirmationModal
            isOpen={isDeleteDialogOpen}
            supplier={selectedSupplier}
            deleteType={deleteType}
            isDeleting={isDeleting}
            isHardDeleting={isHardDeleting}
            onConfirm={handleConfirmDelete}
            onClose={handleDialogClose}
          />
        </div>
      </main>
    </AuthGuard>
  );
}
