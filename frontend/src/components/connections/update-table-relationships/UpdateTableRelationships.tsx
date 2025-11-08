import { addToast } from '@heroui/react';
import RelationshipList from '@/components/onboarding/relationship-confirmation/RelationshipList';
import { Text } from '@/components/ui/Text';
import { useGetCompanyId } from '@/hooks/useGetCompanyId';
import { useTableRelationships } from '@/hooks/useTableRelationships';
import { Icons } from '@/lib/icons/Icons';
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
    ifFetchSavedRelationships: true,
  });
  //TODO:  dekhte hbe ifFetchSavedRelationships ta thik moto kaj kore kina and saveed relation gula render korte hbe
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
      <div className="lg:sticky top-0 z-10 pb-4">
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
      </div>

      {/* Scrollable content area with relationship list */}
      <div className="flex flex-col gap-4">
        <div className="inline-flex lg:items-center gap-x-2">
          <Icons.Exclamatory className="flex-shrink-0 max-lg:mt-1" />
          <Text color="warning">You can confirm the table relations later.</Text>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-200px)] no-scrollbar bottom-fade flex flex-col gap-y-5 pb-4">
          <RelationshipList
            relationships={tableRelationships.data}
            isLoading={isLoading}
            selectedRelationships={relationTablesMap}
            rightSelectOptions={rightSelectOptions}
            onRelationshipChange={handleRightSelectChange}
          />
        </div>
      </div>
    </div>
  );
};

export default UpdateTableRelationships;
