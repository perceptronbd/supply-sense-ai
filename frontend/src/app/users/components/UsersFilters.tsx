'use client';

// 1. React and core libraries
import { useMemo } from 'react';

// 2. External library imports
import { Button, Input, Select, SelectItem } from '@heroui/react';
import { RefreshCw, Search, X } from 'lucide-react';

// 3. Internal alias imports - Store/API
import { useGetRolesQuery } from '@/store/api/roleApi';
import { useGetSuppliersQuery } from '@/store/api/supplierApi';

// 4. Internal alias imports - Components
import { Text } from '@/components/ui/Text';

// 5. Same directory relative imports
import type { UsersPageFilters } from '../hooks/useUsersPage';

interface UsersFiltersProps {
  filters: UsersPageFilters;
  onFilterChange: (filters: Partial<UsersPageFilters>) => void;
  onRefresh: () => void;
  loading?: boolean;
}

export function UsersFilters({ filters, onFilterChange, onRefresh, loading }: UsersFiltersProps) {
  // Fetch roles for filter dropdown
  const { data: roles = [] } = useGetRolesQuery();

  // Fetch branches (using suppliers query as a placeholder - you might need a branches API)
  const { data: branchesResponse } = useGetSuppliersQuery({ limit: 100 }); // This should be a branches API call
  const branches = useMemo(() => {
    if (!branchesResponse) return [];
    return Array.isArray(branchesResponse) ? branchesResponse : branchesResponse.data || [];
  }, [branchesResponse]);

  const handleSearchChange = (value: string) => {
    onFilterChange({ search: value });
  };

  const handleRoleChange = (value: string) => {
    onFilterChange({ roleId: value });
  };

  const handleBranchChange = (value: string) => {
    onFilterChange({ branchId: value });
  };

  const handleStatusChange = (value: string) => {
    let isActive: boolean | null = null;
    if (value === 'active') isActive = true;
    else if (value === 'inactive') isActive = false;
    onFilterChange({ isActive });
  };

  const handleClearFilters = () => {
    onFilterChange({
      search: '',
      roleId: '',
      branchId: '',
      isActive: null,
      page: 1,
    });
  };

  const hasActiveFilters = !!(
    filters.search ||
    filters.roleId ||
    filters.branchId ||
    filters.isActive !== null
  );

  return (
    <section className="p-4 space-y-4 border rounded-lg bg-content1 border-divider">
      <header className="flex items-center justify-between">
        <Text variant="bodyLarge" weight="medium" color="default">
          Filter Users
        </Text>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="light"
            startContent={<RefreshCw className="w-4 h-4" />}
            onPress={onRefresh}
            isLoading={loading}
          >
            Refresh
          </Button>
          {hasActiveFilters && (
            <Button
              size="sm"
              variant="light"
              color="danger"
              startContent={<X className="w-4 h-4" />}
              onPress={handleClearFilters}
            >
              Clear
            </Button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Search */}
        <Input
          placeholder="Search users..."
          value={filters.search}
          onValueChange={handleSearchChange}
          startContent={<Search className="w-4 h-4 text-default-400" />}
          isClearable
          className="w-full"
        />

        {/* Role Filter */}
        <Select
          placeholder="Filter by role"
          selectedKeys={filters.roleId ? [filters.roleId] : []}
          onSelectionChange={(keys) => {
            const value = Array.from(keys)[0] as string;
            handleRoleChange(value || '');
          }}
          className="w-full"
        >
          {roles.map((role) => (
            <SelectItem key={role.id}>{role.name}</SelectItem>
          ))}
        </Select>

        {/* Branch Filter */}
        <Select
          placeholder="Filter by branch"
          selectedKeys={filters.branchId ? [filters.branchId] : []}
          onSelectionChange={(keys) => {
            const value = Array.from(keys)[0] as string;
            handleBranchChange(value || '');
          }}
          className="w-full"
        >
          {branches.map((branch) => (
            <SelectItem key={branch.id}>{branch.name}</SelectItem>
          ))}
        </Select>

        {/* Status Filter */}
        <Select
          placeholder="Filter by status"
          selectedKeys={
            filters.isActive === null ? [] : filters.isActive ? ['active'] : ['inactive']
          }
          onSelectionChange={(keys) => {
            const value = Array.from(keys)[0] as string;
            handleStatusChange(value || '');
          }}
          className="w-full"
        >
          <SelectItem key="active">Active</SelectItem>
          <SelectItem key="inactive">Inactive</SelectItem>
        </Select>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-divider">
          <Text variant="bodySmall" color="muted">
            Active filters:
          </Text>
          {filters.search && (
            <div className="px-2 py-1 text-xs rounded bg-primary/10 text-primary">
              Search: "{filters.search}"
            </div>
          )}
          {filters.roleId && (
            <div className="px-2 py-1 text-xs rounded bg-secondary/10 text-secondary">
              Role: {roles.find((r) => r.id === filters.roleId)?.name || 'Unknown'}
            </div>
          )}
          {filters.branchId && (
            <div className="px-2 py-1 text-xs rounded bg-success/10 text-success">
              Branch: {branches.find((b) => b.id === filters.branchId)?.name || 'Unknown'}
            </div>
          )}
          {filters.isActive !== null && (
            <div className="px-2 py-1 text-xs rounded bg-warning/10 text-warning">
              Status: {filters.isActive ? 'Active' : 'Inactive'}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
