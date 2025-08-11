'use client';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useGetCompanyId } from '@/hooks/useGetCompanyId';
import { Icons } from '@/lib/icons/Icons';
import { cn } from '@/lib/utils';
import { useSaveMetadataMutation } from '@/store/api/onboardingApi';
import { useOnboardingStore } from '@/store/hooks/useOnboardingStore';
import { Accordion, AccordionItem } from '@heroui/react';
import { handleAsyncOperation } from '@supplysense/utils';
import type { IBatchSaveMetadataPayload } from '../types';
import MetadataForm from './MetadataForm';

const MetadataAccordion = () => {
  const { generatedMetadata, dbConnectionId, setOnboardingStep } = useOnboardingStore();
  console.log('🚀 ~ generatedMetadata:', generatedMetadata);
  const { companyId } = useGetCompanyId();
  const [batchSaveMetadata, { isLoading: isSaving }] = useSaveMetadataMutation();

  const handleBatchSave = async () => {
    const tableMetadata = generatedMetadata.map((metadata) => ({
      tableName: metadata.tableName,
      friendlyLabel: metadata.friendlyLabel,
      purpose: metadata.purpose,
      updateFrequency: metadata.updateFrequency,
      dataSensitivity: metadata.dataSensitivity || '',
      sampleQuestions: metadata.sampleQuestions,
    }));

    const payload: IBatchSaveMetadataPayload = {
      companyId,
      payload: {
        dbConnectionId,
        tableMetadata,
      },
    };

    await handleAsyncOperation(
      async () => {
        const result = await batchSaveMetadata(payload).unwrap();
        return result;
      },
      {
        onSuccess() {
          setOnboardingStep(4); // Move to the next step in onboarding
        },
      }
    );
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
      <div className="space-y-4 h-[calc(100vh-200px)] overflow-y-auto no-scrollbar bottom-fade">
        {generatedMetadata.map((metadata) => (
          <Accordion selectionMode="multiple" fullWidth key={metadata.tableName}>
            <AccordionItem
              key="1"
              aria-label={`Metadata for ${metadata.friendlyLabel}`}
              indicator={({ isOpen }) => {
                return (
                  <>
                    {isOpen ? (
                      <Icons.ChevronDownCircle className="text-foreground -rotate-90" />
                    ) : (
                      <Icons.ChevronDownCircle className="text-foreground" />
                    )}
                  </>
                );
              }}
              title={
                <Text variant={'titleSmall'} weight={'medium'}>
                  {metadata.friendlyLabel}
                </Text>
              }
              className="bg-default-300 w-full px-4 rounded-lg"
            >
              <MetadataForm {...metadata} />
            </AccordionItem>
          </Accordion>
        ))}
      </div>
    </section>
  );
};

export default MetadataAccordion;
