// 1. React and core libraries
import { useCallback, useMemo, useState } from 'react';

// 3. Internal alias imports - Store/API
import type { GetUsersRequest, User } from '@/store/api/userApi';
import { useGetUsersQuery } from '@/store/api/userApi';

interface UsersPageFilters {
  search: string;
  roleId: string;
  branchId: string;
  isActive: boolean | null;
  page: number;
  limit: number;
  sortBy: 'firstName' | 'lastName' | 'email' | 'username' | 'createdAt' | 'lastLogin';
  sortOrder: 'asc' | 'desc';
}

const DEFAULT_FILTERS: UsersPageFilters = {
  search: '',
  roleId: '',
  branchId: '',
  isActive: null,
  page: 1,
  limit: 10,
  sortBy: 'firstName',
  sortOrder: 'asc',
};

export function useUsersPage() {
  const [filters, setFilters] = useState<UsersPageFilters>(DEFAULT_FILTERS);

  // Build API query parameters
  const queryParams = useMemo((): GetUsersRequest => {
    const params: GetUsersRequest = {
      page: filters.page,
      limit: filters.limit,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      includeRoles: true,
      includeBranches: true,
    };

    if (filters.search.trim()) {
      params.search = filters.search.trim();
    }

    if (filters.roleId) {
      params.roleId = filters.roleId;
    }

    if (filters.branchId) {
      params.branchId = filters.branchId;
    }

    if (filters.isActive !== null) {
      params.isActive = filters.isActive;
    }

    return params;
  }, [filters]);

  // Fetch users data
  const { data: usersResponse, isLoading: loading, error, refetch } = useGetUsersQuery(queryParams);

  // Extract users and pagination from response
  const { users, pagination } = useMemo(() => {
    if (!usersResponse) {
      return { users: [], pagination: undefined };
    }

    // Handle both paginated and non-paginated responses
    if (Array.isArray(usersResponse)) {
      return { users: usersResponse, pagination: undefined };
    }

    return {
      users: usersResponse.data || [],
      pagination: usersResponse.pagination,
    };
  }, [usersResponse]);

  // Filter change handler
  const handleFilterChange = useCallback((newFilters: Partial<UsersPageFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      // Reset to first page when changing filters (except pagination)
      page: newFilters.page !== undefined ? newFilters.page : 1,
    }));
  }, []);

  // Page change handler
  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  // Refresh handler
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Reset filters handler
  const handleResetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  // Search handler with debounce support
  const handleSearch = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search, page: 1 }));
  }, []);

  // Sort handler
  const handleSort = useCallback(
    (sortBy: UsersPageFilters['sortBy'], sortOrder?: UsersPageFilters['sortOrder']) => {
      setFilters((prev) => ({
        ...prev,
        sortBy,
        sortOrder:
          sortOrder || (prev.sortBy === sortBy && prev.sortOrder === 'asc' ? 'desc' : 'asc'),
        page: 1,
      }));
    },
    []
  );

  // Status filter handler
  const handleStatusFilter = useCallback((isActive: boolean | null) => {
    setFilters((prev) => ({ ...prev, isActive, page: 1 }));
  }, []);

  // Role filter handler
  const handleRoleFilter = useCallback((roleId: string) => {
    setFilters((prev) => ({ ...prev, roleId, page: 1 }));
  }, []);

  // Branch filter handler
  const handleBranchFilter = useCallback((branchId: string) => {
    setFilters((prev) => ({ ...prev, branchId, page: 1 }));
  }, []);

  // Limit change handler
  const handleLimitChange = useCallback((limit: number) => {
    setFilters((prev) => ({ ...prev, limit, page: 1 }));
  }, []);

  return {
    // Data
    users: users as User[],
    loading,
    error,
    pagination,

    // Filters
    filters,

    // Handlers
    handleFilterChange,
    handlePageChange,
    handleRefresh,
    handleResetFilters,
    handleSearch,
    handleSort,
    handleStatusFilter,
    handleRoleFilter,
    handleBranchFilter,
    handleLimitChange,

    // Query info
    queryParams,
  };
}

export type { UsersPageFilters };
