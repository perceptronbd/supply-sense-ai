'use client';

import { Select, SelectItem, type SelectProps } from '@heroui/react';
import { useCallback, useState } from 'react';
import { z } from 'zod';

interface ValidatedSelectProps
  extends Omit<SelectProps, 'children' | 'isInvalid' | 'errorMessage' | 'onSelectionChange'> {
  name: string;
  wasSubmitted: boolean;
  errors?: string[];
  fieldSchema: z.ZodType<unknown>;
  options: { value: string; label: string; disabled?: boolean }[];
  onValueChange?: (name: string, value: string) => void;
}

export function ValidatedSelect({
  name,
  wasSubmitted,
  errors,
  fieldSchema,
  options,
  onValueChange,
  defaultSelectedKeys,
  ...props
}: ValidatedSelectProps) {
  const defaultValue = defaultSelectedKeys ? (Array.from(defaultSelectedKeys)[0] as string) : '';
  const [value, setValue] = useState(defaultValue || '');
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
      isInvalid={hasErrors && shouldRenderErrors}
      errorMessage={hasErrors && shouldRenderErrors ? fieldErrors.join(', ') : undefined}
      selectedKeys={value ? [value] : []}
      variant="bordered"
      classNames={{ popoverContent: 'bg-default-200', ...props.classNames }}
      onSelectionChange={(keys) => {
        const selectedValue = Array.from(keys)[0] as string;
        if (selectedValue) {
          handleSelectionChange(selectedValue);
        }
      }}
      {...props}
    >
      {options.map((option) => (
        <SelectItem key={option.value} isDisabled={option.disabled}>
          {option.label}
        </SelectItem>
      ))}
    </Select>
  );
}
