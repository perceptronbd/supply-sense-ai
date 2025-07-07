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
import { ROLE_PERMISSIONS } from '@supplysense/types';
import { Plus, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import AuthGuard from '@/components/AuthGuard';
import { SearchIcon } from '@/components/icons';
import { DrawingLogo } from '@/components/ui/DrawingLogo';
import { Text } from '@/components/ui/Text';
import { ROUTE_PATHS } from '@/config/routes';
import { usePermissions } from '@/hooks/usePermissions';
import type { Role } from '@/store/api/roleApi';
import { useGetRolesQuery } from '@/store/api/roleApi';

import { RoleTableCell } from './components/RoleTableCell';

export default function RolesPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
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
    data: roles = [],
    isLoading,
    error,
    refetch,
  } = useGetRolesQuery(undefined, { skip: !isMounted });

  // Filter roles based on search and status
  const filteredRoles = roles.filter((role) => {
    const matchesSearch =
      !searchTerm ||
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = includeInactive || role.isActive;

    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const totalItems = filteredRoles.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRoles = filteredRoles.slice(startIndex, endIndex);

  const handleCreateRole = () => {
    router.push(`${ROUTE_PATHS.ROLES}/create`);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handleIncludeInactiveChange = (value: boolean) => {
    setIncludeInactive(value);
    setCurrentPage(1); // Reset to first page when changing filter
  };

  // Table columns definition
  const columns = [
    { name: 'NAME', uid: 'name', sortable: true },
    { name: 'DESCRIPTION', uid: 'description', sortable: false },
    { name: 'PERMISSIONS', uid: 'permissions', sortable: false },
    { name: 'USERS', uid: 'users', sortable: false },
    { name: 'STATUS', uid: 'status', sortable: true },
    { name: 'ACTIONS', uid: 'actions', sortable: false },
  ];

  // Helper function to render cells
  const renderCell = (role: Role, columnKey: string) => {
    return <RoleTableCell role={role} columnKey={columnKey} />;
  };

  // Calculate totals for stats
  const totalRoles = roles.length;
  const activeRoles = roles.filter((role) => role.isActive).length;
  const inactiveRoles = totalRoles - activeRoles;

  // Loading state before mount
  if (!isMounted) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="p-6">
          <DrawingLogo size={60} variant="primary" speed="fast" showFill={true} />
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requireAuth={true}>
      <main className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <header className="flex flex-col items-start justify-between w-full gap-4 sm:flex-row sm:items-center">
            <div className="flex flex-col gap-3">
              <Text variant="headerSmall" weight="bold" color="default" as="h1">
                Roles
              </Text>
              <Text variant="bodySmall" color="muted" as="p">
                Manage roles and permissions
              </Text>
            </div>
            {hasPermission(ROLE_PERMISSIONS.CREATE) && (
              <Button
                color="primary"
                startContent={<Plus className="w-4 h-4" />}
                onPress={handleCreateRole}
              >
                Create Role
              </Button>
            )}
          </header>

          {/* Main Content */}
          <section>
            <Card>
              <CardHeader className="flex flex-col gap-4 pb-3">
                <div className="flex items-center justify-between w-full">
                  <Text variant="titleSmall" weight="semiBold" as="h2">
                    All Roles
                  </Text>
                  {/* Status Summary */}
                  <div className="flex flex-wrap justify-end gap-2">
                    <Chip color="primary" variant="flat" size="sm">
                      Total: {totalRoles}
                    </Chip>
                    <Chip color="success" variant="flat" size="sm">
                      Active: {activeRoles}
                    </Chip>
                    <Chip color="default" variant="flat" size="sm">
                      Inactive: {inactiveRoles}
                    </Chip>
                  </div>
                </div>
                {/* Search and Filters */}
                <div className="flex flex-col justify-start w-full gap-4 sm:flex-row">
                  <Input
                    placeholder="Search roles by name or description..."
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
                  <div className="flex items-center justify-center py-12">
                    <DrawingLogo size={60} variant="primary" speed="fast" showFill={true} />
                  </div>
                )}

                {/* Error State */}
                {error && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Text variant="bodyLarge" weight="medium" color="danger">
                      Failed to load roles
                    </Text>
                    <Text variant="bodySmall" color="muted" className="mt-2">
                      {typeof error === 'object' && 'message' in error
                        ? error.message
                        : 'An error occurred while loading roles'}
                    </Text>
                    <Button
                      color="primary"
                      variant="flat"
                      className="mt-4"
                      onPress={() => refetch()}
                    >
                      Try Again
                    </Button>
                  </div>
                )}

                {/* Table */}
                {!isLoading && !error && (
                  <>
                    <Table aria-label="Roles table" removeWrapper>
                      <TableHeader columns={columns}>
                        {(column) => (
                          <TableColumn key={column.uid} allowsSorting={column.sortable}>
                            {column.name}
                          </TableColumn>
                        )}
                      </TableHeader>
                      <TableBody
                        items={paginatedRoles}
                        emptyContent={
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Shield className="w-12 h-12 mb-4 text-default-400" />
                            <Text variant="bodyLarge" weight="medium" color="default">
                              No roles found
                            </Text>
                            <Text variant="bodySmall" color="muted" className="mt-1">
                              {searchTerm
                                ? 'No roles match your search criteria'
                                : 'No roles have been created yet'}
                            </Text>
                          </div>
                        }
                      >
                        {(role) => (
                          <TableRow key={role.id}>
                            {(columnKey) => (
                              <TableCell>{renderCell(role, columnKey as string)}</TableCell>
                            )}
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between pt-4 mt-6 border-t border-divider">
                        <div className="flex items-center gap-4">
                          <Select
                            size="sm"
                            placeholder="Items per page"
                            defaultSelectedKeys={[itemsPerPage.toString()]}
                            className="w-32"
                            onChange={(e) =>
                              handleItemsPerPageChange(Number.parseInt(e.target.value))
                            }
                          >
                            <SelectItem key="10">10</SelectItem>
                            <SelectItem key="25">25</SelectItem>
                            <SelectItem key="50">50</SelectItem>
                          </Select>
                          <Text variant="bodySmall" className="text-default-400">
                            Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of{' '}
                            {totalItems} roles
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
              </CardBody>
            </Card>
          </section>
        </div>
      </main>
    </AuthGuard>
  );
}
