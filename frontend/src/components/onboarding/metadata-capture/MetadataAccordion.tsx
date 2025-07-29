'use client';
import { Text } from '@/components/ui/Text';
import { Icons } from '@/lib/icons/Icons';
import { useOnboardingStore } from '@/store/hooks/useOnboardingStore';
import { Accordion, AccordionItem } from '@heroui/react';
import MetadataForm from './MetadataForm';

const MetadataAccordion = () => {
  const { generatedMetadata } = useOnboardingStore();

  return generatedMetadata.map((metadata) => (
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
  ));
};

export default MetadataAccordion;
