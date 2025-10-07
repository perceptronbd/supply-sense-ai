import { useCallback, useEffect, useState } from 'react';
import { useGetCompanyId } from '@/hooks/useGetCompanyId';
import { useGetDatabaseConnectionsQuery } from '@/store/api/dbConnectionApi';

interface DatabaseConnection {
  id: string;
  name?: string;
  // Add other properties as needed
}

export interface UseDatabaseConnectionsReturn {
  databaseConnections: DatabaseConnection[] | undefined;
  selectedDbConnectionId: string | undefined;
  isLoadingConnections: boolean;
  connectionsError: unknown;
  selectDbConnection: (connectionId: string) => void;
}

/**
 * Custom hook for managing database connections
 * Handles fetching, selection, and auto-selection of database connections
 */
export function useDatabaseConnections(): UseDatabaseConnectionsReturn {
  const { companyId } = useGetCompanyId();
  const [selectedDbConnectionId, setSelectedDbConnectionId] = useState<string | undefined>();

  const {
    data: databaseConnections,
    isLoading: isLoadingConnections,
    error: connectionsError,
  } = useGetDatabaseConnectionsQuery(companyId, {
    skip: !companyId,
  });

  // Auto-select first database connection when available
  useEffect(() => {
    if (databaseConnections && databaseConnections.length > 0 && !selectedDbConnectionId) {
      setSelectedDbConnectionId(databaseConnections[0].id);
    }
  }, [databaseConnections, selectedDbConnectionId]);

  const selectDbConnection = useCallback((connectionId: string) => {
    setSelectedDbConnectionId(connectionId);
  }, []);

  return {
    databaseConnections,
    selectedDbConnectionId,
    isLoadingConnections,
    connectionsError,
    selectDbConnection,
  };
}
