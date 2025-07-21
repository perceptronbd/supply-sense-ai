import { Text } from '@/components/ui/Text';
import { Icons } from '@/lib/icons/Icons';
import { Accordion, AccordionItem } from '@heroui/react';
import MetadataForm from './MetadataForm';

const MetadataAccordion = () => {
  return (
    <Accordion selectionMode="multiple" fullWidth>
      <AccordionItem
        key="1"
        aria-label="Accordion 1"
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
            Branch Table
          </Text>
        }
        className="bg-default-300 w-full px-4 rounded-lg"
      >
        <MetadataForm />
      </AccordionItem>
    </Accordion>
  );
};

export default MetadataAccordion;
