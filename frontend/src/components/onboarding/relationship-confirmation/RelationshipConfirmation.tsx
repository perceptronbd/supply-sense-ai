'use client';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useGetCompanyId } from '@/hooks/useGetCompanyId';
import { Icons } from '@/lib/icons/Icons';
import { cn } from '@/lib/utils';
import {
  useGetTableRelationshipsQuery,
  useUpsertTableRelationshipsMutation,
} from '@/store/api/onboardingApi';
import { useOnboardingStore } from '@/store/hooks/useOnboardingStore';
import { handleAsyncOperation } from '@supplysense/utils';
// Import necessary React hooks and components
import { useCallback, useMemo, useState, useTransition } from 'react';
import Summary from '../Summary';
import type {
  IRelationshipTables,
  IUpsertTableRelationshipsPayload,
} from '../types/table-relationship';
import MemoizedRelationshipCard from './MemoizedRelationshipCard';
import RelationshipCardSkeleton from './RelationshipCardSkeleton';
const RelationshipConfirmation = () => {
  // Get the current company ID from custom hook
  const { companyId } = useGetCompanyId();

  // Get the current database connection ID and onboarding step from store
  const { dbConnectionId, currentStep, setOnboardingStep } = useOnboardingStore();

  // Fetch table relationships for the current company and connection, only on step 4
  const { data: tableRelationships = { data: [] }, isLoading } = useGetTableRelationshipsQuery(
    {
      companyId,
      dbConnectionId,
    },
    {
      skip: !(companyId && dbConnectionId && currentStep === 4),
    }
  );

  // State to track the user's selected/confirmed relationships
  const [relationTables, setRelationTables] = useState<IRelationshipTables[]>([]);

  // React 18 transition for non-blocking state updates
  const [_, startTransition] = useTransition();

  const [upsertTableRelationships, { isLoading: isUpserting }] =
    useUpsertTableRelationshipsMutation();

  // Create a lookup map for fast access to selected relationships by table/column
  const relationTablesMap = useMemo(() => {
    return new Map(relationTables.map((item) => [`${item.tableName}_${item.columnName}`, item]));
  }, [relationTables]);

  // Build unique right-side select options for relationship cards
  const rightSelectOptions = useMemo(() => {
    const seen = new Set<string>();
    return tableRelationships.data
      .map((relatedTable) => ({
        value: `${relatedTable.refTable}_${relatedTable.refColumn}`,
        label: `${relatedTable.refTable}_${relatedTable.refColumn}`,
        table: relatedTable.tableName,
      }))
      .filter((option) => {
        if (seen.has(option.value)) {
          return false;
        }
        seen.add(option.value);
        return true;
      });
  }, [tableRelationships.data]);

  // Handler to update the selected relationship for a given table/column
  const handleRightSelectChange = useCallback((value: IRelationshipTables) => {
    // Use startTransition to make the state update non-blocking
    startTransition(() => {
      setRelationTables((prev) => {
        const key = `${value.tableName}_${value.columnName}`;

        // Check if the relationship already exists in state
        const existingIndex = prev.findIndex(
          (item) => `${item.tableName}_${item.columnName}` === key
        );

        if (existingIndex >= 0) {
          // Update the existing relationship
          const updated = [...prev];
          updated[existingIndex] = value;
          return updated;
        }

        // Add a new relationship
        return [...prev, value];
      });
    });
  }, []);

  // Handler to confirm all selected relationships
  const handleConfirmRelationships = useCallback(async () => {
    // Prepare the payload for the API call
    const payload: IUpsertTableRelationshipsPayload = {
      companyId,
      dbConnectionId,
      // Map the selected relationships to the expected format
      relationships: relationTables.map((item) => ({
        tableName: item.tableName,
        columnName: item.columnName,
        refTable: item.refTable,
        refColumn: item.refColumn,
        description: item.description,
        isConfirmed: true,
      })),
    };

    await handleAsyncOperation(
      async () => {
        const result = await upsertTableRelationships(payload).unwrap();
        return result;
      },
      {
        onSuccess: () => {
          // Clear the selected relationships after successful confirmation
          setRelationTables([]);
          setOnboardingStep(5); // Move to the next onboarding step
        },
      }
    );
  }, [relationTables, companyId, dbConnectionId, upsertTableRelationships, setOnboardingStep]);

  return (
    <>
      {/* Left side: summary and instructions */}
      <Summary
        header="Help Link"
        headerHighlight="Related Tables"
        description="Confirm how tables are connected so the agent can ask smarter questions."
        subDescription="You can skip relationships now and define them later."
      />

      {/* Right side: relationship confirmation form */}
      <section className="flex flex-col gap-y-5 w-[36rem] ms-auto max-h-[calc(100vh-7rem)] xl:max-h-[calc(100vh-12rem)] overflow-y-auto no-scrollbar bottom-fade ">
        <div className="flex items-center justify-between ">
          <div className="inline-flex items-center gap-x-2 ">
            <Icons.Exclamatory />{' '}
            <Text color="warning">You can confirm the table relations later.</Text>
          </div>
          <Button
            variant={'light'}
            color={'default'}
            className={cn('text-default-500 mb-3 w-fit', {
              'opacity-50 cursor-not-allowed': isLoading,
              'text-primary': relationTables.length > 0,
            })}
            isLoading={isUpserting}
            onPress={handleConfirmRelationships}
          >
            Confirm <Icons.ArrowRight className="size-4" />
          </Button>
        </div>

        {/* Show loading spinner or the list of relationship cards */}
        {isLoading
          ? Array.from({ length: 2 }, (_, index) => <RelationshipCardSkeleton key={index} />)
          : tableRelationships.data.map((table) => {
              const leftKey = `${table.tableName}_${table.columnName}`;

              // Use Map for O(1) lookup instead of O(n) find
              const selectedTable = relationTablesMap.get(leftKey);
              const rightKey = selectedTable
                ? `${selectedTable.refTable}_${selectedTable.refColumn}`
                : `${table.refTable}_${table.refColumn}`;

              return (
                <MemoizedRelationshipCard
                  key={leftKey}
                  table={table}
                  isLoading={isLoading}
                  rightSelectOptions={rightSelectOptions}
                  leftSelectedKey={leftKey}
                  rightSelectedKey={rightKey}
                  onRightSelectChange={handleRightSelectChange}
                />
              );
            })}
      </section>
    </>
  );
};

export default RelationshipConfirmation;
