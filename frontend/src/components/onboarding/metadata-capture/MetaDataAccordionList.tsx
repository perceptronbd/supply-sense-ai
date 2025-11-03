import { Accordion, AccordionItem } from '@heroui/react';
import { Text } from '@/components/ui/Text';
import { Icons } from '@/lib/icons/Icons';
import type { IGeneratedMetadata } from '../types';
import MetadataForm from './MetadataForm';

interface IProps {
  metadata: IGeneratedMetadata;
}
const MetaDataAccordionList = ({ metadata }: IProps) => {
  return (
    <Accordion selectionMode="multiple" fullWidth key={metadata.tableName} variant="splitted">
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
        classNames={{
          base: 'bg-default-300 w-full px-4',
        }}
      >
        <MetadataForm {...metadata} />
      </AccordionItem>
    </Accordion>
  );
};

export default MetaDataAccordionList;
