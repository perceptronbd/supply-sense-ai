'use client';

// 1. React and core libraries
import { useMemo } from 'react';

// 2. External library imports
import {
  Button,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';
import { AlertCircle, RefreshCw } from 'lucide-react';

// 3. Internal alias imports - Store/API
import type { User } from '@/store/api/userApi';
import type { SerializedError } from '@reduxjs/toolkit';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

// 4. Internal alias imports - Components
import { Text } from '@/components/ui/Text';

// 5. Same directory relative imports
import { UserTableCell } from './UserTableCell';

interface UsersTableProps {
  users: User[];
  loading?: boolean;
  error?: FetchBaseQueryError | SerializedError | null;
  onRefresh?: () => void;
}

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'username', label: 'Username' },
  { key: 'roles', label: 'Roles' },
  { key: 'branches', label: 'Branches' },
  { key: 'status', label: 'Status' },
  { key: 'lastLogin', label: 'Last Login' },
  { key: 'actions', label: 'Actions' },
];

export function UsersTable({ users, loading, error, onRefresh }: UsersTableProps) {
  const tableUsers = useMemo(() => {
    return users.map((user) => ({
      ...user,
      name: `${user.firstName} ${user.lastName}`,
    }));
  }, [users]);

  // Helper function to extract error message
  const getErrorMessage = (error: FetchBaseQueryError | SerializedError): string => {
    if ('status' in error) {
      // FetchBaseQueryError
      return `Request failed with status ${error.status}`;
    }
    // SerializedError
    return error.message || 'An unexpected error occurred';
  };

  if (error) {
    return (
      <section className="flex flex-col items-center justify-center p-8 space-y-4 border rounded-lg bg-content1 border-divider">
        <AlertCircle className="w-12 h-12 text-danger" />
        <div className="text-center">
          <Text variant="bodyLarge" weight="medium" color="danger">
            Failed to load users
          </Text>
          <Text variant="bodySmall" color="muted" className="mt-1">
            {getErrorMessage(error)}
          </Text>
        </div>
        {onRefresh && (
          <Button
            color="primary"
            variant="flat"
            startContent={<RefreshCw className="w-4 h-4" />}
            onPress={onRefresh}
          >
            Try Again
          </Button>
        )}
      </section>
    );
  }

  return (
    <section className="border rounded-lg bg-content1 border-divider">
      <Table aria-label="Users table" removeWrapper>
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn key={column.key} className="bg-content2">
              {column.label}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody
          items={tableUsers}
          isLoading={loading}
          loadingContent={<Skeleton className="w-full rounded-lg h-80" />}
          emptyContent={
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
              <div className="p-3 rounded-full bg-default-100">
                <div className="w-6 h-6 text-default-400" />
              </div>
              <div className="text-center">
                <Text variant="bodyLarge" weight="medium" color="default">
                  No users found
                </Text>
                <Text variant="bodySmall" color="muted" className="mt-1">
                  No users match your current filters
                </Text>
              </div>
            </div>
          }
        >
          {(user) => (
            <TableRow key={user.id}>
              {(columnKey) => (
                <TableCell>
                  <UserTableCell user={user} columnKey={columnKey} />
                </TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </section>
  );
}
