import { Text } from '@/components/ui/Text';
import { Icons } from '@/lib/icons/Icons';
import { Input, Radio, RadioGroup, Textarea } from '@heroui/react';
const UPDATE_FREQUENCY_OPTIONS = [
  { value: 'realtime', label: 'Real-time' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
];
const SAMPLE_QUESTIONS = [
  'What is the total sales for the last month?',
  'How many new customers were acquired this quarter?',
  'What is the average order value for the last week?',
];
const MetadataForm = () => {
  return (
    <div className="space-y-5 pb-5">
      <Input
        label="Friendly Label"
        placeholder="Enter friendly label"
        variant="faded"
        color="primary"
        isRequired
      />
      <Textarea
        label="Table Purpose"
        placeholder="Describe the purpose of this table"
        variant="faded"
        color="primary"
        isRequired
        size="sm"
      />

      <RadioGroup
        label={
          <Text variant={'bodyBase'} weight={'medium'}>
            Update Frequency:
          </Text>
        }
        className="mb-3"
      >
        <div className="flex items-center gap-4">
          {UPDATE_FREQUENCY_OPTIONS.map((option) => (
            <Radio key={option.value} value={option.value} color="primary">
              {option.label}
            </Radio>
          ))}
        </div>
      </RadioGroup>
      <Input
        label="Data Sensitivity"
        placeholder="Enter data sensitivity level"
        variant="faded"
        color="primary"
        isRequired
      />
      <Input
        label="Sample Questions"
        placeholder="Enter sample questions"
        variant="faded"
        color="primary"
        isRequired
      />
      <div className="flex w-full flex-wrap gap-2 mt-2">
        {SAMPLE_QUESTIONS.map((value) => (
          <button
            key={value}
            type="button"
            className="flex items-center justify-center text-sm  gap-x-2 bg-default-400 rounded-md px-3 py-1"
            // onClick={() => handleRemove(value as string)}
          >
            {value} <Icons.X className="size-4" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default MetadataForm;
