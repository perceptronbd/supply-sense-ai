'use client';

import {
  Button,
  Card,
  CardBody,
  CardHeader,
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
import { USER_PERMISSIONS } from '@supplysense/types';
import { Plus, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import AuthGuard from '@/components/AuthGuard';
import { SearchIcon } from '@/components/icons';
import { DrawingLogo } from '@/components/ui/DrawingLogo';
import { PermissionGuard } from '@/components/ui/PermissionGuard';
import { Text } from '@/components/ui/Text';
import { ROUTE_PATHS } from '@/config/routes';
import type { User } from '@/store/api/userApi';

import { UserTableCell } from './components/UserTableCell';
import { useUsersPage } from './hooks/useUsersPage';

export default function UsersPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  const {
    users,
    loading,
    error,
    filters,
    pagination,
    handleFilterChange,
    handlePageChange,
    handleRefresh,
  } = useUsersPage();

  // Ensure component is mounted before rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleCreateUser = () => {
    router.push(`${ROUTE_PATHS.USERS}/create`);
  };

  // Table columns definition
  const columns = [
    { name: 'NAME', uid: 'name', sortable: true },
    { name: 'EMAIL', uid: 'email', sortable: true },
    { name: 'USERNAME', uid: 'username', sortable: true },
    { name: 'ROLES', uid: 'roles', sortable: false },
    { name: 'BRANCHES', uid: 'branches', sortable: false },
    { name: 'STATUS', uid: 'status', sortable: true },
    { name: 'LAST LOGIN', uid: 'lastLogin', sortable: true },
    { name: 'ACTIONS', uid: 'actions', sortable: false },
  ];

  // Helper function to render cells
  const renderCell = (user: User & { name: string }, columnKey: string) => {
    return <UserTableCell user={user} columnKey={columnKey} />;
  };

  // Transform users to include name property
  const usersWithName = useMemo(() => {
    return users.map((user) => ({
      ...user,
      name: `${user.firstName} ${user.lastName}`,
    }));
  }, [users]);

  // Calculate totals for stats
  const totalUsers = users.length;
  const activeUsers = users.filter((user) => user.isActive).length;
  const inactiveUsers = totalUsers - activeUsers;

  // Calculate pagination
  const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 1;

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
                Users
              </Text>
              <Text variant="bodySmall" color="muted" as="p">
                Manage user accounts and permissions
              </Text>
            </div>
            <PermissionGuard permission={USER_PERMISSIONS.CREATE}>
              <Button
                color="primary"
                startContent={<Plus className="w-4 h-4" />}
                onPress={handleCreateUser}
              >
                Create User
              </Button>
            </PermissionGuard>
          </header>

          {/* Main Content */}
          <section>
            <Card>
              <CardHeader className="flex flex-col gap-4 pb-3">
                <div className="flex items-center justify-between w-full">
                  <Text variant="titleSmall" weight="semiBold" as="h2">
                    All Users
                  </Text>
                  {/* Status Summary */}
                  <div className="flex flex-wrap justify-end gap-2">
                    <Chip color="primary" variant="flat" size="sm">
                      Total: {pagination?.total || totalUsers}
                    </Chip>
                    <Chip color="success" variant="flat" size="sm">
                      Active: {activeUsers}
                    </Chip>
                    <Chip color="default" variant="flat" size="sm">
                      Inactive: {inactiveUsers}
                    </Chip>
                  </div>
                </div>
                {/* Search and Filters */}
                <div className="flex flex-col justify-start w-full gap-4 sm:flex-row">
                  <Input
                    placeholder="Search users by name, email, or username..."
                    value={filters.search || ''}
                    onValueChange={(value) => handleFilterChange({ search: value })}
                    startContent={<SearchIcon className="w-4 h-4 text-default-400" />}
                    className="w-full sm:w-96"
                    variant="bordered"
                  />
                  {/* <div className="flex items-center gap-4">
                    <Checkbox
                      isSelected={filters.isActive === null}
                      onValueChange={(value) =>
                        handleFilterChange({ isActive: value ? null : true })
                      }
                      size="sm"
                    >
                      Include inactive
                    </Checkbox>
                  </div> */}
                </div>
              </CardHeader>

              <CardBody>
                {/* Loading State */}
                {loading && (
                  <div className="flex items-center justify-center py-12">
                    <DrawingLogo size={60} variant="primary" speed="fast" showFill={true} />
                  </div>
                )}

                {/* Error State */}
                {error && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Text variant="bodyLarge" weight="medium" color="danger">
                      Failed to load users
                    </Text>
                    <Text variant="bodySmall" color="muted" className="mt-2">
                      {typeof error === 'object' && 'message' in error
                        ? error.message
                        : 'An error occurred while loading users'}
                    </Text>
                    <Button color="primary" variant="flat" className="mt-4" onPress={handleRefresh}>
                      Try Again
                    </Button>
                  </div>
                )}

                {/* Table */}
                {!loading && !error && (
                  <>
                    <Table aria-label="Users table" removeWrapper>
                      <TableHeader columns={columns}>
                        {(column) => (
                          <TableColumn key={column.uid} allowsSorting={column.sortable}>
                            {column.name}
                          </TableColumn>
                        )}
                      </TableHeader>
                      <TableBody
                        items={usersWithName}
                        emptyContent={
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Users className="w-12 h-12 mb-4 text-default-400" />
                            <Text variant="bodyLarge" weight="medium" color="default">
                              No users found
                            </Text>
                            <Text variant="bodySmall" color="muted" className="mt-1">
                              {filters.search
                                ? 'No users match your search criteria'
                                : 'No users have been created yet'}
                            </Text>
                          </div>
                        }
                      >
                        {(user) => (
                          <TableRow key={user.id}>
                            {(columnKey) => (
                              <TableCell>{renderCell(user, columnKey as string)}</TableCell>
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
                            defaultSelectedKeys={[pagination?.limit.toString() || '10']}
                            className="w-32"
                            onChange={(e) =>
                              handleFilterChange({ limit: Number.parseInt(e.target.value) })
                            }
                          >
                            <SelectItem key="10">10</SelectItem>
                            <SelectItem key="25">25</SelectItem>
                            <SelectItem key="50">50</SelectItem>
                          </Select>
                          <Text variant="bodySmall" className="text-default-400">
                            {pagination && (
                              <>
                                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                                {pagination.total} users
                              </>
                            )}
                          </Text>
                        </div>
                        <Pagination
                          isCompact
                          showControls
                          showShadow
                          color="primary"
                          page={pagination?.page || 1}
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
