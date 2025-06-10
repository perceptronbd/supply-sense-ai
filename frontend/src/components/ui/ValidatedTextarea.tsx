'use client';

import { Textarea } from '@heroui/react';
import { useCallback, useState } from 'react';
import { z } from 'zod';

interface ValidatedTextareaProps {
  name: string;
  wasSubmitted: boolean;
  errors?: string[];
  fieldSchema: z.ZodType<unknown>;
  label?: string;
  required?: boolean;
  onValueChange?: (name: string, value: string) => void;
  placeholder?: string;
  defaultValue?: string;
  rows?: number;
  minRows?: number;
  maxRows?: number;
  className?: string;
  variant?: 'flat' | 'bordered' | 'faded' | 'underlined';
  labelPlacement?: 'inside' | 'outside' | 'outside-left';
  disableAutosize?: boolean;
}

export function ValidatedTextarea({
  name,
  wasSubmitted,
  errors,
  fieldSchema,
  label,
  required = false,
  onValueChange,
  defaultValue,
  placeholder,
  rows,
  minRows = 3,
  maxRows = 8,
  className = '',
  variant = 'bordered',
  labelPlacement = 'inside',
  disableAutosize = false,
  ...props
}: ValidatedTextareaProps) {
  const [value, setValue] = useState(defaultValue?.toString() || '');
  const [touched, setTouched] = useState(false);

  const getErrors = useCallback(() => {
    const validationResult = fieldSchema.safeParse(value);
    return validationResult.success ? [] : validationResult.error.flatten().formErrors;
  }, [fieldSchema, value]);

  const fieldErrors = errors || getErrors();
  const shouldRenderErrors = errors || wasSubmitted || touched;
  const hasErrors = fieldErrors.length > 0;

  const handleBlur = () => setTouched(true);
  const handleValueChange = (newValue: string) => {
    setValue(newValue);
    onValueChange?.(name, newValue);
  };

  return (
    <Textarea
      name={name}
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
      minRows={minRows}
      maxRows={maxRows}
      disableAutosize={disableAutosize}
      {...(rows && { minRows: rows, maxRows: rows })}
      {...props}
    />
  );
}
