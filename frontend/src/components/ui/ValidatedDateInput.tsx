'use client';

import { DateInput } from '@heroui/react';
import { type CalendarDate, getLocalTimeZone, parseDate, today } from '@internationalized/date';
import { useCallback, useState } from 'react';
import { z } from 'zod';

interface ValidatedDateInputProps {
  name: string;
  wasSubmitted: boolean;
  errors?: string[];
  fieldSchema: z.ZodType<unknown>;
  label?: string;
  required?: boolean;
  onValueChange?: (name: string, value: string) => void;
  defaultValue?: string;
  className?: string;
}

export function ValidatedDateInput({
  name,
  wasSubmitted,
  errors,
  fieldSchema,
  label,
  required = false,
  onValueChange,
  defaultValue,
  className = '',
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

  const [value, setValue] = useState(getDateValue(defaultValue));
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

  const handleValueChange = (dateValue: CalendarDate | null) => {
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
      label={label}
      value={value}
      onChange={handleValueChange}
      onBlur={handleBlur}
      isRequired={required}
      isInvalid={Boolean(hasErrors && shouldRenderErrors)}
      errorMessage={shouldRenderErrors && hasErrors ? fieldErrors[0] : undefined}
      minValue={minValue}
      labelPlacement="inside"
      variant="bordered"
      className={className}
      classNames={{
        base: 'w-full',
        input: 'bg-transparent',
        inputWrapper:
          'border-default-300 data-[hover=true]:border-default-400 data-[focus=true]:border-primary',
        label: 'text-foreground font-medium pb-1',
      }}
    />
  );
}
