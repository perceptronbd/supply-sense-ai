'use client';
import { Card, Select, SelectItem } from '@heroui/react';
import React, { useState } from 'react';
import { Text } from '@/components/ui/Text';
import { Icons } from '@/lib/icons/Icons';
import { TActionButtonVariants } from './ActionButton';
import RelationshipActionButtons from './RelationshipActionButtons';

interface IProps {
  isLoading?: boolean;
  description: string;
  rightSelectOptions: { label: string; value: string; table: string }[];
  leftSelectedKey: string;
  rightSelectedKey: string;
  onRightSelectChange: (value: string) => void;
}

const RelationshipCard = ({
  isLoading,
  description,
  rightSelectOptions,
  leftSelectedKey,
  rightSelectedKey,
  onRightSelectChange,
}: IProps) => {
  const [buttonClicked, setButtonClicked] = useState<TActionButtonVariants | null>(null);

  const [isOpen, setIsOpen] = useState(false);

  // Removed unused buttonClicked state
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onRightSelectChange(e.target.value);
  };

  const leftSelectedKeys = React.useMemo(
    () => (leftSelectedKey ? [leftSelectedKey] : []),
    [leftSelectedKey]
  );

  const rightSelectedKeys = React.useMemo(
    () => (rightSelectedKey ? [rightSelectedKey] : []),
    [rightSelectedKey]
  );

  const handleButtonClick = (variant: TActionButtonVariants) => {
    onRightSelectChange(variant);
    setButtonClicked(variant);
  };

  return (
    <div className="place-items-end max-md:mt-5 w-full">
      <Card className="!p-5 w-full bg-default-300 space-y-5">
        {/* select input */}
        <div className="flex max-lg:flex-col items-center gap-2 ">
          {/* NOTE:  first select will be disabled */}
          <Select
            isDisabled
            selectedKeys={leftSelectedKeys}
            isLoading={isLoading}
            aria-label="Source Table Column"
          >
            <SelectItem key={leftSelectedKey}>{leftSelectedKey}</SelectItem>
          </Select>

          <Icons.ChevronRight className="flex-shrink-0 size-6 max-lg:rotate-90" />

          <Select
            placeholder="Select Related Table"
            aria-label="Related Table Column"
            onChange={handleSelectChange}
            selectedKeys={rightSelectedKeys}
            items={rightSelectOptions}
            isOpen={isOpen}
            onOpenChange={setIsOpen}
          >
            {(option) => (
              <SelectItem key={option.value} textValue={option.value}>
                {option.label}{' '}
                <Text variant={'bodyXSmall'} as="span" className="text-default-500">
                  ({option.table})
                </Text>
              </SelectItem>
            )}
          </Select>
        </div>
        {/* description */}
        <Text>{description}</Text>
        <RelationshipActionButtons
          buttonClicked={buttonClicked}
          onButtonClick={(variant) => {
            handleButtonClick(variant);
            // open select if "no" is pressed
            if (variant === 'no') setIsOpen(true);
          }}
        />
      </Card>
    </div>
  );
};
export default RelationshipCard;
