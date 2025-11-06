'use client';
import { useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useGetCompanyId } from '@/hooks/useGetCompanyId';
import { useTableRelationships } from '@/hooks/useTableRelationships';
import { Icons } from '@/lib/icons/Icons';
import { cn } from '@/lib/utils';
import { useOnboardingStore } from '@/store/hooks/useOnboardingStore';
import Summary from '../Summary';
import RelationshipList from './RelationshipList';

const RelationshipConfirmation = () => {
  const { companyId, userId } = useGetCompanyId();
  const { dbConnectionId, setOnboardingStep } = useOnboardingStore();

  const {
    tableRelationships,
    isLoading,
    relationTablesMap,
    rightSelectOptions,
    handleRightSelectChange,
    handleConfirmRelationships,
    isUpserting,
  } = useTableRelationships({
    companyId,
    dbConnectionId,
    userId,
  });

  // Wrap handleConfirmRelationships to include the onboarding step update
  const handleConfirm = useCallback(async () => {
    await handleConfirmRelationships(() => {
      setOnboardingStep(5); // Move to the next onboarding step
    });
  }, [handleConfirmRelationships, setOnboardingStep]);

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
      <section className="flex flex-col gap-y-5 w-full lg:w-[36rem] ms-auto max-h-[calc(100vh-7rem)] xl:max-h-[calc(100vh-12rem)] relative">
        <div className="sticky top-0 z-10 flex gap-4 items-center justify-between">
          <div className="inline-flex lg:items-center gap-x-2">
            <Icons.Exclamatory className="flex-shrink-0 max-lg:mt-1" />
            <Text color="warning">You can confirm the table relations later.</Text>
          </div>
          <Button
            variant={'light'}
            color={'primary'}
            className={cn('lg:w-fit', {
              'opacity-50 cursor-not-allowed': isLoading,
            })}
            isLoading={isUpserting}
            onPress={handleConfirm}
          >
            Confirm <Icons.ArrowRight className="size-4" />
          </Button>
        </div>

        {/* Scrollable content area with relationship list */}
        <div className="overflow-y-auto no-scrollbar bottom-fade flex flex-col gap-y-5 pb-4">
          <RelationshipList
            relationships={tableRelationships.data}
            isLoading={isLoading}
            selectedRelationships={relationTablesMap}
            rightSelectOptions={rightSelectOptions}
            onRelationshipChange={handleRightSelectChange}
          />
        </div>
      </section>
    </>
  );
};

export default RelationshipConfirmation;
