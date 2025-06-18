'use client';

import AuthGuard from '@/components/AuthGuard';
import { SearchIcon } from '@/components/icons';
import { ActionsDropdown, StatusChip, StockDisplay } from '@/components/items';
import { DrawingLogo } from '@/components/ui/DrawingLogo';
import { Text } from '@/components/ui/Text';
import { type Item, useGetItemsQuery } from '@/store/api/itemApi';
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
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

export default function ItemsPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  // Filter and pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [includeInactive, setIncludeInactive] = useState(false);

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

  const items = itemsResponse?.data || [];
  const pagination = itemsResponse?.pagination;

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

  // Table row content
  const renderCell = useCallback(
    (item: Item, columnKey: string) => {
      switch (columnKey) {
        case 'sku':
          return (
            <Text variant="bodyMedium" weight="medium">
              {item.sku || '—'}
            </Text>
          );
        case 'name':
          return (
            <Text variant="bodyMedium" weight="medium">
              {item.name || '—'}
            </Text>
          );
        case 'description':
          return (
            <Text variant="bodySmall" color="muted" className="max-w-xs truncate">
              {item.description || '—'}
            </Text>
          );
        case 'mainUnit':
          return <Text variant="bodyMedium">{item.mainUnit || '—'}</Text>;
        case 'stock':
          return <StockDisplay stock={item.stock} />;
        case 'status':
          return <StatusChip isActive={item.isActive} />;
        case 'actions':
          return <ActionsDropdown item={item} onViewDetails={handleViewDetails} />;
        default:
          return null;
      }
    },
    [handleViewDetails]
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
                Items
              </Text>
              <Text variant="bodyBase" color="muted" className="mt-2" as="p">
                Manage your inventory items and view stock levels
              </Text>
            </div>
          </header>

          {/* Items Table and Filters */}
          <section>
            <Card>
              <CardHeader className="pb-3 flex flex-col gap-4">
                <div className="flex justify-between items-center w-full">
                  <Text variant="titleSmall" weight="semiBold" as="h2">
                    All Items
                  </Text>
                  {/* Status Summary Chips */}
                  <div className="flex flex-wrap gap-2 justify-end">
                    <Chip
                      color="primary"
                      variant="flat"
                      size="sm"
                      startContent={<div className="bg-primary rounded-full w-1.5 h-1.5" />}
                    >
                      Total: {pagination?.total || items.length}
                    </Chip>
                    <Chip
                      color="success"
                      variant="flat"
                      size="sm"
                      startContent={<div className="bg-success rounded-full w-1.5 h-1.5" />}
                    >
                      Active: {items.filter((item) => item.isActive).length}
                    </Chip>
                    <Chip
                      color="default"
                      variant="flat"
                      size="sm"
                      startContent={<div className="bg-default-500 rounded-full w-1.5 h-1.5" />}
                    >
                      Inactive: {items.filter((item) => !item.isActive).length}
                    </Chip>
                  </div>{' '}
                </div>
                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-4 justify-start w-full">
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
                {/* Loading State */}
                {isLoading && (
                  <div className="flex justify-center items-center py-12">
                    <DrawingLogo size={60} variant="primary" speed="fast" showFill={true} />
                  </div>
                )}
                {/* Error State */}
                {error && (
                  <div className="text-center py-12">
                    <Text variant="bodyLarge" color="danger" className="mb-4">
                      Failed to load items
                    </Text>
                    <Button color="primary" variant="flat" onPress={() => refetch()}>
                      Try Again
                    </Button>
                  </div>
                )}
                {/* Empty State */}
                {!isLoading && !error && items.length === 0 && (
                  <div className="text-center py-12">
                    <Text variant="bodyLarge" color="muted" className="mb-2">
                      {searchTerm ? 'No items found matching your search' : 'No items found'}
                    </Text>
                    {searchTerm && (
                      <Text variant="bodyMedium" color="muted">
                        Try adjusting your search criteria
                      </Text>
                    )}
                  </div>
                )}{' '}
                {/* Items Table */}
                {!isLoading && !error && items.length > 0 && (
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
                            {(columnKey) => (
                              <TableCell>{renderCell(item, columnKey as string)}</TableCell>
                            )}
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>{' '}
                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
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
                              handleItemsPerPageChange(newItemsPerPage.toString());
                            }}
                          >
                            <SelectItem key="10">10</SelectItem>
                            <SelectItem key="25">25</SelectItem>
                            <SelectItem key="50">50</SelectItem>
                            <SelectItem key="100">100</SelectItem>
                          </Select>
                          <Text variant="bodySmall" color="muted">
                            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                            {pagination.total} items
                          </Text>
                        </div>
                        <Pagination
                          page={currentPage}
                          total={pagination.totalPages}
                          onChange={handlePageChange}
                          showControls
                          color="primary"
                        />
                      </div>
                    )}{' '}
                  </>
                )}
              </CardBody>
            </Card>
          </section>
        </div>
      </main>
    </AuthGuard>
  );
}
