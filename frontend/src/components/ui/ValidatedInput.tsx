'use client';

import { Input } from '@heroui/react';
import { useCallback, useState } from 'react';
import { z } from 'zod';

interface ValidatedInputProps {
  name: string;
  wasSubmitted: boolean;
  errors?: string[];
  fieldSchema: z.ZodType<unknown>;
  label?: string;
  required?: boolean;
  onValueChange?: (name: string, value: string) => void;
  type?: string;
  placeholder?: string;
  defaultValue?: string | number;
  min?: string;
  max?: string;
  step?: string;
  className?: string;
  variant?: 'flat' | 'bordered' | 'underlined' | 'faded';
  labelPlacement?: 'inside' | 'outside' | 'outside-left';
}

export function ValidatedInput({
  name,
  wasSubmitted,
  errors,
  fieldSchema,
  label,
  required = false,
  onValueChange,
  defaultValue,
  type = 'text',
  placeholder,
  min,
  max,
  step,
  className = '',
  variant = 'bordered',
  labelPlacement = 'inside',
  ...props
}: ValidatedInputProps) {
  const [value, setValue] = useState(defaultValue?.toString() || '');
  const [touched, setTouched] = useState(false);

  const getErrors = useCallback(() => {
    // For number inputs, convert the string value to number for validation
    let valueToValidate: string | number = value;
    if (type === 'number' && value !== '') {
      const numValue = Number.parseFloat(value);
      valueToValidate = Number.isNaN(numValue) ? value : numValue;
    }

    const validationResult = fieldSchema.safeParse(valueToValidate);
    return validationResult.success ? [] : validationResult.error.flatten().formErrors;
  }, [fieldSchema, value, type]);

  const fieldErrors = errors || getErrors();
  const shouldRenderErrors = errors || wasSubmitted || touched;
  const hasErrors = fieldErrors.length > 0;

  const handleBlur = () => setTouched(true);
  const handleValueChange = (newValue: string) => {
    setValue(newValue);
    onValueChange?.(name, newValue);
  };

  return (
    <Input
      name={name}
      type={type}
      label={label}
      placeholder={placeholder}
      value={value}
      onValueChange={handleValueChange}
      onBlur={handleBlur}
      isRequired={required}
      isInvalid={Boolean(hasErrors && shouldRenderErrors)}
      errorMessage={shouldRenderErrors && hasErrors ? fieldErrors.join(', ') : ''}
      variant={variant}
      labelPlacement={labelPlacement}
      className={className}
      min={min}
      max={max}
      step={step}
      {...props}
    />
  );
}
