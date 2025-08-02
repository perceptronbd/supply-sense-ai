import { Text } from '@/components/ui/Text';
import { Icons } from '@/lib/icons/Icons';
import { useOnboardingStore } from '@/store/hooks/useOnboardingStore';
import { Input, Radio, RadioGroup, Textarea } from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { type ComponentPropsWithRef, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import type { IGeneratedMetadata } from '../types';
import { type TMetadataFormData, metadataFormSchema } from './schema';

const UPDATE_FREQUENCY_OPTIONS = [
  { value: 'realtime', label: 'Real-time' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
] as const;

interface IProps extends IGeneratedMetadata, ComponentPropsWithRef<'form'> {}

const MetadataForm = (props: IProps) => {
  const { tableName, friendlyLabel, purpose, updateFrequency, dataSensitivity, sampleQuestions } =
    props;

  const [newQuestion, setNewQuestion] = useState('');
  const { updateMetadata } = useOnboardingStore();

  const {
    control,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<TMetadataFormData>({
    resolver: zodResolver(metadataFormSchema),
    defaultValues: {
      friendlyLabel,
      purpose,
      updateFrequency: updateFrequency as 'realtime' | 'hourly' | 'daily' | 'weekly',
      dataSensitivity: dataSensitivity || '',
      sampleQuestions,
    },
  });

  const watchedValues = watch();

  // Auto-save when form values change
  useEffect(() => {
    if (isDirty) {
      const timeoutId = setTimeout(() => {
        updateMetadata(tableName, watchedValues);
      }, 100); // Debounce for 100ms

      return () => clearTimeout(timeoutId);
    }
  }, [watchedValues, isDirty, tableName, updateMetadata]);

  const handleAddQuestion = () => {
    if (newQuestion.trim()) {
      const currentQuestions = watchedValues.sampleQuestions || [];
      setValue('sampleQuestions', [...currentQuestions, newQuestion.trim()], {
        shouldDirty: true,
      });
      setNewQuestion('');
    }
  };

  const handleRemoveQuestion = (questionToRemove: string) => {
    const currentQuestions = watchedValues.sampleQuestions || [];
    setValue(
      'sampleQuestions',
      currentQuestions.filter((q) => q !== questionToRemove),
      { shouldDirty: true }
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddQuestion();
    }
  };

  return (
    <form className="space-y-5 pb-5">
      <Controller
        name="friendlyLabel"
        control={control}
        render={({ field }) => (
          <Input
            {...field}
            label="Friendly Label"
            placeholder="Enter friendly label"
            variant="faded"
            color="primary"
            isRequired
            isInvalid={!!errors.friendlyLabel}
            errorMessage={errors.friendlyLabel?.message}
          />
        )}
      />

      <Controller
        name="purpose"
        control={control}
        render={({ field }) => (
          <Textarea
            {...field}
            label="Table Purpose"
            placeholder="Describe the purpose of this table"
            variant="faded"
            color="primary"
            isRequired
            size="sm"
            isInvalid={!!errors.purpose}
            errorMessage={errors.purpose?.message}
          />
        )}
      />

      <Controller
        name="updateFrequency"
        control={control}
        render={({ field }) => (
          <RadioGroup
            {...field}
            label={
              <Text variant={'bodyBase'} weight={'medium'}>
                Update Frequency:
              </Text>
            }
            className="mb-3"
            isInvalid={!!errors.updateFrequency}
            errorMessage={errors.updateFrequency?.message}
          >
            <div className="flex items-center gap-4">
              {UPDATE_FREQUENCY_OPTIONS.map((option) => (
                <Radio key={option.value} value={option.value} color="primary">
                  {option.label}
                </Radio>
              ))}
            </div>
          </RadioGroup>
        )}
      />

      <Controller
        name="dataSensitivity"
        control={control}
        render={({ field }) => (
          <Input
            {...field}
            label="Data Sensitivity"
            placeholder="Enter data sensitivity level"
            variant="faded"
            color="primary"
            isRequired
            isInvalid={!!errors.dataSensitivity}
            errorMessage={errors.dataSensitivity?.message}
          />
        )}
      />

      <div className="space-y-3">
        <Input
          label="Sample Questions"
          placeholder="Enter a sample question"
          variant="faded"
          color="primary"
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          onKeyDown={handleKeyPress}
          className="flex-1"
        />

        {errors.sampleQuestions && (
          <p className="text-danger text-sm">{errors.sampleQuestions.message}</p>
        )}

        <div className="flex w-full flex-wrap gap-2">
          {watchedValues.sampleQuestions?.map((question) => (
            <button
              key={question}
              type="button"
              className="flex items-center justify-center text-sm text-left gap-x-2 bg-default-400 rounded-md px-3 py-1 hover:bg-default-500 transition-colors"
              onClick={() => handleRemoveQuestion(question)}
            >
              {question} <Icons.X className="size-4" />
            </button>
          ))}
        </div>
      </div>
    </form>
  );
};

export default MetadataForm;
