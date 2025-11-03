'use client';
import { Button } from '@/components/ui/Button';
import { useBatchSaveMetadata } from '@/hooks/useBatchSaveMetadata';
import { Icons } from '@/lib/icons/Icons';
import { cn } from '@/lib/utils';
import { useOnboardingStore } from '@/store/hooks/useOnboardingStore';
import MetaDataAccordionList from './MetaDataAccordionList';

const MetadataAccordion = () => {
  const { generatedMetadata, dbConnectionId, setOnboardingStep } = useOnboardingStore();

  const { saveBatchMetadata, isSaving } = useBatchSaveMetadata({
    dbConnectionId,
    onSuccess: () => setOnboardingStep(4), // Move to the next step in onboarding
  });

  const handleBatchSave = () => {
    saveBatchMetadata(generatedMetadata);
  };

  return (
    <section>
      <div className="inline-flex justify-end w-full">
        <Button
          variant="light"
          color="primary"
          className={cn('mb-3  w-fit', {
            'opacity-50 cursor-not-allowed': isSaving,
          })}
          onClick={handleBatchSave}
          isLoading={isSaving}
        >
          {isSaving ? (
            'Capturing Metadata...'
          ) : (
            <>
              Confirm <Icons.ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </div>
      <div className="space-y-4 h-[calc(100vh-200px)] overflow-y-auto no-scrollbar pb-20 bottom-fade">
        {generatedMetadata.map((metadata) => (
          <MetaDataAccordionList key={metadata.tableName} metadata={metadata} />
        ))}
      </div>
    </section>
  );
};

export default MetadataAccordion;
