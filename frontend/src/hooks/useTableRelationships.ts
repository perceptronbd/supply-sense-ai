import { handleAsyncOperation } from '@supplysense/utils';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { IRelationshipTables } from '@/components/onboarding/types/table-relationship';
import {
  useGetTableRelationshipsQuery,
  useUpsertTableRelationshipsMutation,
} from '@/store/api/onboardingApi';

/**
 * Custom hook for managing table relationships in the application.
 * Handles fetching, updating, and managing the state of table relationships
 * between different database tables.
 */

/**
 * Props for the useTableRelationships hook
 * @property {string} companyId - The ID of the company
 * @property {string} dbConnectionId - The ID of the database connection
 * @property {string} userId - The ID of the current user
 */
type UseTableRelationshipsProps = {
  companyId: string;
  dbConnectionId: string;
  userId: string;
};

/**
 * Return type of the useTableRelationships hook
 * @property {Object} tableRelationships - Contains the list of all table relationships
 * @property {boolean} isLoading - Indicates if the data is currently being loaded
 * @property {Map<string, IRelationshipTables>} relationTablesMap - Map of relationships for quick lookup
 * @property {IRelationshipTables[]} relationTables - Array of current relationship states
 * @property {Function} setRelationTables - Function to update the relationship states
 * @property {Array} rightSelectOptions - Options for the relationship selector dropdown
 * @property {Function} handleRightSelectChange - Handler for when a relationship is changed
 * @property {Function} handleConfirmRelationships - Handler for confirming/saving relationships
 * @property {boolean} isUpserting - Indicates if a save operation is in progress
 */
type UseTableRelationshipsResult = {
  tableRelationships: { data: IRelationshipTables[] };
  isLoading: boolean;
  relationTablesMap: Map<string, IRelationshipTables>;
  relationTables: IRelationshipTables[];
  setRelationTables: React.Dispatch<React.SetStateAction<IRelationshipTables[]>>;
  rightSelectOptions: Array<{ value: string; label: string; table: string }>;
  handleRightSelectChange: (value: IRelationshipTables) => void;
  handleConfirmRelationships: (onSuccess?: () => void) => Promise<void>;
  isUpserting: boolean;
};

/**
 * Custom hook to manage table relationships
 * @param {UseTableRelationshipsProps} props - The hook props
 * @returns {UseTableRelationshipsResult} The hook's state and handlers
 */
export const useTableRelationships = ({
  companyId,
  dbConnectionId,
  userId,
}: UseTableRelationshipsProps): UseTableRelationshipsResult => {
  // State to track the user's selected/confirmed relationships
  const [relationTables, setRelationTables] = useState<IRelationshipTables[]>([]);

  // React 18 transition for non-blocking state updates
  // This allows high-priority updates to interrupt lower-priority updates
  const [_, startTransition] = useTransition();

  // State to track if an upsert operation is in progress
  const [isUpserting, setIsUpserting] = useState(false);

  // RTK Query mutation hook for upserting table relationships
  const [upsertTableRelationships] = useUpsertTableRelationshipsMutation();

  /**
   * Fetch table relationships for the current company and database connection
   * Uses RTK Query's auto-generated hook for data fetching
   */
  const { data: tableRelationshipsData = { data: [] }, isLoading: isRelationshipsLoading } =
    useGetTableRelationshipsQuery(
      {
        companyId,
        dbConnectionId,
      },
      {
        // Only run the query if we have both companyId and dbConnectionId
        skip: !(companyId && dbConnectionId),
      }
    );

  // Create a consistent data structure for the rest of the component
  // This ensures we always have a data array, even if the query hasn't returned yet
  const tableRelationships = { data: tableRelationshipsData.data || [] };

  /**
   * Create a lookup map for O(1) access to relationships by table.column
   * This is more efficient than using Array.find() for lookups
   */
  const relationTablesMap = useMemo(() => {
    return new Map(relationTables.map((item) => [`${item.tableName}.${item.columnName}`, item]));
  }, [relationTables]);

  /**
   * Generate unique options for the relationship selector dropdown
   * Ensures no duplicate values and formats them for the select component
   */
  const rightSelectOptions = useMemo(() => {
    const seen = new Set<string>();
    return tableRelationships.data
      .map((relatedTable) => ({
        value: `${relatedTable.refTable}.${relatedTable.refColumn}`,
        label: `${relatedTable.refTable}.${relatedTable.refColumn}`,
        table: relatedTable.tableName,
      }))
      .filter((option) => {
        // Filter out duplicate values
        if (seen.has(option.value)) {
          return false;
        }
        seen.add(option.value);
        return true;
      });
  }, [tableRelationships.data]);

  /**
   * Handler for when a relationship is changed in the UI
   * Updates the local state with the new relationship
   * Uses React's startTransition for non-blocking updates
   */
  const handleRightSelectChange = useCallback((value: IRelationshipTables) => {
    // Wrap in startTransition to ensure UI remains responsive during state updates
    startTransition(() => {
      setRelationTables((prev) => {
        // Create a unique key for this relationship
        const key = `${value.tableName}_${value.columnName}`;

        // Check if we're updating an existing relationship
        const existingIndex = prev.findIndex(
          (item) => `${item.tableName}_${item.columnName}` === key
        );

        if (existingIndex >= 0) {
          // Update existing relationship
          const updated = [...prev];
          updated[existingIndex] = value;
          return updated;
        }

        // Add new relationship
        return [...prev, value];
      });
    });
  }, []);

  /**
   * Handler for confirming/saving all selected relationships
   * @param {Function} onSuccess - Optional callback to execute after successful save
   */
  const handleConfirmRelationships = useCallback(
    async (onSuccess?: () => void) => {
      // Guard clause to ensure required IDs are present
      if (!companyId || !dbConnectionId) return;

      // Set loading state
      setIsUpserting(true);

      try {
        // Prepare the payload for the API call
        const payload = {
          companyId,
          dbConnectionId,
          // Transform the relationships into the format expected by the API
          relationships: relationTables,
        };

        // Use the handleAsyncOperation utility for consistent error handling
        await handleAsyncOperation(
          async () => {
            // Call the API to save the relationships
            const result = await upsertTableRelationships({ userId, payload }).unwrap();
            return result;
          },
          {
            onSuccess: () => {
              // Clear the local state on success
              setRelationTables([]);
              // Execute the success callback if provided
              onSuccess?.();
            },
          }
        );
      } finally {
        // Always reset the loading state, even if there was an error
        setIsUpserting(false);
      }
    },
    [relationTables, companyId, dbConnectionId, userId, upsertTableRelationships]
  );

  /**
   * Effect to initialize the relationship state when the table data is loaded
   * Only runs when there are no existing relationships and we have table data
   */
  useEffect(() => {
    if (relationTables.length === 0 && tableRelationships.data.length > 0) {
      // Initialize the relationships with default values
      setRelationTables(
        tableRelationships.data.map((item) => ({
          tableName: item.tableName,
          columnName: item.columnName,
          refTable: item.refTable,
          refColumn: item.refColumn,
          description: item.description || '',
          isConfirmed: true, // Default to confirmed
          actionVariant: 'yes', // Default to yes
        }))
      );
    }
  }, [tableRelationships.data, relationTables.length]);

  // Combine loading states to determine if the component is in a loading state
  const isLoading = isRelationshipsLoading || tableRelationships.data.length === 0;

  return {
    tableRelationships,
    isLoading,
    relationTablesMap,
    relationTables,
    setRelationTables,
    rightSelectOptions,
    handleRightSelectChange,
    handleConfirmRelationships,
    isUpserting,
  };
};
