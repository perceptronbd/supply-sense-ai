import MetaDataAccordionList from '@/components/onboarding/metadata-capture/MetaDataAccordionList';
import { useBatchSaveMetadata } from '@/hooks/useBatchSaveMetadata';
import { useOnboardingStore } from '@/store/hooks/useOnboardingStore';
import { ConnectionsTitleAndButtons } from '../connections-title-and-buttons/ConnectionsTitleAndButtons';

interface IProps {
  dbConnectionId: string;
}

const UpdateTableSelections = ({ dbConnectionId }: IProps) => {
  const { generatedMetadata, setUpdateCurrentStep } = useOnboardingStore();

  const { saveBatchMetadata, isSaving } = useBatchSaveMetadata({
    dbConnectionId,
    onSuccess: () => setUpdateCurrentStep(3),
  });

  const handleBatchSave = () => {
    saveBatchMetadata(generatedMetadata);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <ConnectionsTitleAndButtons
        title="Table Selection"
        description="Update table details, context and sample questions."
        primaryActionText="Save"
        secondaryActionText="Next"
        isDisabled={isSaving}
        isSubmitting={isSaving}
        onPrimaryAction={handleBatchSave}
        onSecondaryAction={() => setUpdateCurrentStep(3)}
      />
      <div className="space-y-4 h-[calc(100vh-200px)] overflow-y-auto no-scrollbar pb-20 bottom-fade">
        {generatedMetadata.map((metadata) => (
          <MetaDataAccordionList key={metadata.tableName} metadata={metadata} />
        ))}
      </div>
    </div>
  );
};

export default UpdateTableSelections;
