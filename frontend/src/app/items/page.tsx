'use client';

import AuthGuard from '@/components/AuthGuard';
import { SearchIcon } from '@/components/icons';
import {
  ActionsDropdown,
  DeleteItemDialog,
  ItemsTableContent,
  StatusChip,
  StockDisplay,
} from '@/components/items';
import { DrawingLogo } from '@/components/ui/DrawingLogo';
import { Text } from '@/components/ui/Text';
import { usePermissions } from '@/hooks/usePermissions';
import { type Item, useGetItemsQuery } from '@/store/api/itemApi';
import { Button, Card, CardBody, CardHeader, Checkbox, Chip, Input } from '@heroui/react';
import { ITEM_PERMISSIONS } from '@supplysense/types';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function ItemsPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const [isMounted, setIsMounted] = useState(false);

  // Filter and pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [includeInactive, setIncludeInactive] = useState(false);

  // Dialog state (only for delete confirmation)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [deleteType, setDeleteType] = useState<'soft' | 'hard'>('soft');

  // Ensure component is mounted before rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // API query
  const {
    data: itemsResponse,
    isLoading,
    error,
    refetch,
  } = useGetItemsQuery(
    {
      search: searchTerm || undefined,
      page: currentPage,
      limit: itemsPerPage,
      includeInactive,
      includeStock: true,
    },
    { skip: !isMounted }
  );

  // Ensure items is always an array, with detailed debugging
  const items = Array.isArray(itemsResponse?.data) ? itemsResponse.data : [];
  const pagination = itemsResponse?.pagination;

  // Enhanced debug logging to see what we're actually getting
  console.log('=== ITEMS DEBUG ===');
  console.log('itemsResponse:', itemsResponse);
  console.log('itemsResponse?.data:', itemsResponse?.data);
  console.log('itemsResponse?.data type:', typeof itemsResponse?.data);
  console.log('itemsResponse?.data isArray:', Array.isArray(itemsResponse?.data));
  console.log('final items:', items);
  console.log('final items isArray:', Array.isArray(items));
  console.log('items length:', items.length);
  console.log('=== END DEBUG ===');

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

  // Table columns
  const columns = [
    { name: 'SKU', uid: 'sku', sortable: true },
    { name: 'Name', uid: 'name', sortable: true },
    { name: 'Description', uid: 'description', sortable: false },
    { name: 'Main Unit', uid: 'mainUnit', sortable: true },
    { name: 'Stock', uid: 'stock', sortable: false },
    { name: 'Status', uid: 'status', sortable: true },
    { name: 'Actions', uid: 'actions', sortable: false },
  ];

  // Handle navigation to item details
  const handleViewDetails = useCallback(
    (itemId: string) => {
      router.push(`/items/${itemId}`);
    },
    [router]
  );

  // Handle edit item
  const handleEditItem = useCallback(
    (item: Item) => {
      router.push(`/items/${item.id}/edit`);
    },
    [router]
  );

  // Handle delete item
  const handleDeleteItem = useCallback((item: Item, deleteType: 'soft' | 'hard') => {
    setSelectedItem(item);
    setDeleteType(deleteType);
    setIsDeleteDialogOpen(true);
  }, []);

  // Handle create new item
  const handleCreateItem = useCallback(() => {
    router.push('/items/create');
  }, [router]);

  // Handle dialog close
  const handleDialogClose = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setSelectedItem(null);
  }, []);

  // Table row content
  const renderCell = useCallback(
    (item: Item, columnKey: string) => {
      const cellRenderers = {
        sku: () => (
          <Text variant="bodyMedium" weight="medium">
            {item.sku || '—'}
          </Text>
        ),
        name: () => (
          <Text variant="bodyMedium" weight="medium">
            {item.name || '—'}
          </Text>
        ),
        description: () => (
          <Text variant="bodySmall" color="muted" className="max-w-xs truncate">
            {item.description || '—'}
          </Text>
        ),
        mainUnit: () => <Text variant="bodyMedium">{item.mainUnit || '—'}</Text>,
        stock: () => <StockDisplay stock={item.stock} />,
        status: () => <StatusChip isActive={item.isActive} />,
        actions: () => (
          <ActionsDropdown
            item={item}
            onViewDetails={handleViewDetails}
            onEdit={handleEditItem}
            onDelete={handleDeleteItem}
          />
        ),
      };

      const renderer = cellRenderers[columnKey as keyof typeof cellRenderers];
      return renderer ? renderer() : null;
    },
    [handleViewDetails, handleEditItem, handleDeleteItem]
  );

  // Don't render anything until mounted
  if (!isMounted) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="p-6">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-center justify-center h-64">
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
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <header className="flex items-center justify-between mb-6">
            <div>
              <Text variant="headerSmall" weight="bold" color="default" as="h1">
                Items
              </Text>
              <Text variant="bodyBase" color="muted" className="mt-2" as="p">
                Manage your inventory items and view stock levels
              </Text>
            </div>
            {hasPermission(ITEM_PERMISSIONS.CREATE) && (
              <Button
                color="primary"
                onPress={handleCreateItem}
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
                Add Item
              </Button>
            )}
          </header>

          {/* Items Table and Filters */}
          <section>
            <Card>
              <CardHeader className="flex flex-col gap-4 pb-3">
                <div className="flex items-center justify-between w-full">
                  <Text variant="titleSmall" weight="semiBold" as="h2">
                    All Items
                  </Text>
                  {/* Status Summary Chips */}
                  <div className="flex flex-wrap justify-end gap-2">
                    <Chip
                      color="primary"
                      variant="flat"
                      size="sm"
                      startContent={<div className="bg-primary rounded-full w-1.5 h-1.5" />}
                    >
                      Total: {pagination?.total || (Array.isArray(items) ? items.length : 0)}
                    </Chip>
                    <Chip
                      color="success"
                      variant="flat"
                      size="sm"
                      startContent={<div className="bg-success rounded-full w-1.5 h-1.5" />}
                    >
                      Active:{' '}
                      {Array.isArray(items) ? items.filter((item) => item.isActive).length : 0}
                    </Chip>
                    <Chip
                      color="default"
                      variant="flat"
                      size="sm"
                      startContent={<div className="bg-default-500 rounded-full w-1.5 h-1.5" />}
                    >
                      Inactive:{' '}
                      {Array.isArray(items) ? items.filter((item) => !item.isActive).length : 0}
                    </Chip>
                  </div>{' '}
                </div>
                {/* Search and Filters */}
                <div className="flex flex-col justify-start w-full gap-4 sm:flex-row">
                  <Input
                    placeholder="Search items by name, SKU, or description..."
                    value={searchTerm}
                    onValueChange={handleSearchChange}
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
                <ItemsTableContent
                  isLoading={isLoading}
                  error={error}
                  items={items}
                  searchTerm={searchTerm}
                  columns={columns}
                  renderCell={renderCell}
                  pagination={pagination}
                  currentPage={currentPage}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                  onRefetch={refetch}
                />
              </CardBody>
            </Card>
          </section>

          {/* Delete Dialog */}
          <DeleteItemDialog
            isOpen={isDeleteDialogOpen}
            onClose={handleDialogClose}
            item={selectedItem}
            deleteType={deleteType}
          />
        </div>
      </main>
    </AuthGuard>
  );
}
