'use client';

import { Select, SelectItem } from '@heroui/react';
import { useCallback, useState } from 'react';
import { z } from 'zod';

interface ValidatedSelectProps {
  name: string;
  wasSubmitted: boolean;
  errors?: string[];
  fieldSchema: z.ZodType<unknown>;
  label?: string;
  required?: boolean;
  options: { value: string; label: string; disabled?: boolean }[];
  placeholder?: string;
  onValueChange?: (name: string, value: string) => void;
  defaultValue?: string;
  className?: string;
}

export function ValidatedSelect({
  name,
  wasSubmitted,
  errors,
  fieldSchema,
  label,
  required = false,
  options,
  placeholder = 'Select an option',
  className = '',
  onValueChange,
  defaultValue,
}: ValidatedSelectProps) {
  const [value, setValue] = useState(defaultValue?.toString() || '');
  const [touched, setTouched] = useState(false);

  const getErrors = useCallback(() => {
    const validationResult = fieldSchema.safeParse(value);
    return validationResult.success ? [] : validationResult.error.flatten().formErrors;
  }, [fieldSchema, value]);

  const fieldErrors = errors || getErrors();
  const shouldRenderErrors = Boolean(errors) || wasSubmitted || touched;
  const hasErrors = fieldErrors.length > 0;

  const handleSelectionChange = (selectedValue: string) => {
    setValue(selectedValue);
    onValueChange?.(name, selectedValue);
    setTouched(true);
  };

  return (
    <Select
      name={name}
      label={label}
      placeholder={placeholder}
      isRequired={required}
      isInvalid={hasErrors && shouldRenderErrors}
      errorMessage={hasErrors && shouldRenderErrors ? fieldErrors.join(', ') : undefined}
      selectedKeys={value ? [value] : []}
      onSelectionChange={(keys) => {
        const selectedValue = Array.from(keys)[0] as string;
        if (selectedValue) {
          handleSelectionChange(selectedValue);
        }
      }}
      className={className}
    >
      {options.map((option) => (
        <SelectItem key={option.value} isDisabled={option.disabled}>
          {option.label}
        </SelectItem>
      ))}
    </Select>
  );
}
