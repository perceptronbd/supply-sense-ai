import { addToast } from '@heroui/react';
import RelationshipList from '@/components/onboarding/relationship-confirmation/RelationshipList';
import { useGetCompanyId } from '@/hooks/useGetCompanyId';
import { useTableRelationships } from '@/hooks/useTableRelationships';
import { ConnectionsTitleAndButtons } from '../connections-title-and-buttons/ConnectionsTitleAndButtons';

interface IProps {
  dbConnectionId: string;
}

const UpdateTableRelationships = ({ dbConnectionId }: IProps) => {
  const { companyId, userId } = useGetCompanyId();
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
  const handleConfirm = async () => {
    await handleConfirmRelationships(() => {
      addToast({
        title: 'Relationships saved',
        description: 'Relationships saved successfully',
        variant: 'flat',
        color: 'success',
      });
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <ConnectionsTitleAndButtons
        title="Table Relationships"
        description="Update table relationships."
        primaryActionText="Save"
        secondaryActionText="Next"
        isDisabled={isUpserting}
        isSubmitting={isUpserting}
        onPrimaryAction={handleConfirm}
        showChevronOnSecondary={false}
      />

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
    </div>
  );
};

export default UpdateTableRelationships;
