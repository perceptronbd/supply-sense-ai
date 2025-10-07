'use client';

import { DateInput, type DateInputProps } from '@heroui/react';
import { type DateValue, getLocalTimeZone, parseDate, today } from '@internationalized/date';
import { useCallback, useState } from 'react';
import { z } from 'zod';

interface ValidatedDateInputProps
  extends Omit<
    DateInputProps,
    'isInvalid' | 'errorMessage' | 'onChange' | 'defaultValue' | 'validate'
  > {
  name: string;
  wasSubmitted: boolean;
  errors?: string[];
  fieldSchema: z.ZodType<unknown>;
  onValueChange?: (name: string, value: string) => void;
  defaultValue?: string;
}

export function ValidatedDateInput({
  name,
  wasSubmitted,
  errors,
  fieldSchema,
  onValueChange,
  defaultValue,
  ...props
}: ValidatedDateInputProps) {
  // Convert string date to DateValue for HeroUI DateInput
  const getDateValue = (dateString?: string) => {
    if (!dateString) return null;
    try {
      // Parse ISO date string (YYYY-MM-DD) or full ISO string
      const dateOnly = dateString.split('T')[0]; // Get just the date part
      if (!dateOnly) return null;
      return parseDate(dateOnly);
    } catch {
      return null;
    }
  };

  const [value, setValue] = useState<DateValue | null>(getDateValue(defaultValue?.toString()));
  const [touched, setTouched] = useState(false);

  const getErrors = useCallback(() => {
    // Convert DateValue back to string for validation
    const stringValue = value ? value.toString() : '';
    const validationResult = fieldSchema.safeParse(stringValue);
    return validationResult.success ? [] : validationResult.error.flatten().formErrors;
  }, [fieldSchema, value]);

  const fieldErrors = errors || getErrors();
  const shouldRenderErrors = Boolean(errors) || wasSubmitted || touched;
  const hasErrors = Boolean(fieldErrors && fieldErrors.length > 0);

  const handleValueChange = (dateValue: DateValue | null) => {
    setValue(dateValue);
    // Convert DateValue to ISO string for the parent component
    const stringValue = dateValue ? dateValue.toString() : '';
    onValueChange?.(name, stringValue);
  };

  const handleBlur = () => {
    setTouched(true);
  };

  // Set minimum date to today
  const minValue = today(getLocalTimeZone());

  return (
    <DateInput
      name={name}
      value={value ?? undefined}
      defaultValue={getDateValue(defaultValue?.toString()) ?? undefined}
      onChange={handleValueChange}
      onBlur={handleBlur}
      isInvalid={Boolean(hasErrors && shouldRenderErrors)}
      errorMessage={shouldRenderErrors && hasErrors ? fieldErrors[0] : undefined}
      minValue={minValue}
      {...props}
    />
  );
}
