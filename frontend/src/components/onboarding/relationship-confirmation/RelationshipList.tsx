import { useMemo } from 'react';
import { IRelationshipTables } from '../types/table-relationship';
import MemoizedRelationshipCard from './MemoizedRelationshipCard';
import RelationshipCardSkeleton from './RelationshipCardSkeleton';

type RelationshipListProps = {
  /** Array of table relationships to display */
  relationships: IRelationshipTables[];
  /** Loading state */
  isLoading: boolean;
  /** Selected relationships mapped by table.column */
  selectedRelationships: Map<string, IRelationshipTables>;
  /** Options for the right side select dropdown */
  rightSelectOptions: Array<{ value: string; label: string; table: string }>;
  /** Callback when a relationship is changed */
  onRelationshipChange: (value: IRelationshipTables) => void;
};

/**
 * A reusable component that displays a list of table relationships with the ability to edit them.
 * Handles loading states and provides a consistent UI for relationship management.
 */
const RelationshipList = ({
  relationships,
  isLoading,
  selectedRelationships,
  rightSelectOptions,
  onRelationshipChange,
}: RelationshipListProps) => {
  // Memoize the relationship list to prevent unnecessary re-renders
  const relationshipItems = useMemo(() => {
    return relationships.map((table) => {
      const leftKey = `${table.tableName}.${table.columnName}`;
      const selectedTable = selectedRelationships.get(leftKey);
      const rightKey = selectedTable
        ? `${selectedTable.refTable}.${selectedTable.refColumn}`
        : `${table.refTable}.${table.refColumn}`;

      return (
        <MemoizedRelationshipCard
          key={leftKey}
          table={table}
          isLoading={isLoading}
          rightSelectOptions={rightSelectOptions}
          leftSelectedKey={leftKey}
          rightSelectedKey={rightKey}
          onRightSelectChange={onRelationshipChange}
        />
      );
    });
  }, [relationships, isLoading, selectedRelationships, rightSelectOptions, onRelationshipChange]);

  // Show loading skeletons when data is being loaded
  if (isLoading) {
    return (
      <>
        <RelationshipCardSkeleton key="skeleton-1" />
        <RelationshipCardSkeleton key="skeleton-2" />
      </>
    );
  }

  // Show the list of relationship cards
  return <>{relationshipItems}</>;
};

export default RelationshipList;
