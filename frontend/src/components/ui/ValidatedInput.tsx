'use client';

import { InputHTMLAttributes, useCallback, useState } from 'react';
import { z } from 'zod';

interface ValidatedInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  name: string;
  wasSubmitted: boolean;
  errors?: string[];
  fieldSchema: z.ZodType<unknown>;
  label?: string;
  required?: boolean;
  onValueChange?: (name: string, value: string) => void;
}

export function ValidatedInput({
  name,
  wasSubmitted,
  errors,
  fieldSchema,
  label,
  required = false,
  className = '',
  onValueChange,
  ...props
}: ValidatedInputProps) {
  const [value, setValue] = useState(props.defaultValue?.toString() || '');
  const [touched, setTouched] = useState(false);

  const getErrors = useCallback(() => {
    const validationResult = fieldSchema.safeParse(value);
    return validationResult.success ? [] : validationResult.error.flatten().formErrors;
  }, [fieldSchema, value]);

  const fieldErrors = errors || getErrors();
  const shouldRenderErrors = errors || wasSubmitted || touched;
  const hasErrors = fieldErrors.length > 0;

  const handleBlur = () => setTouched(true);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    onValueChange?.(name, newValue);
  };

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        id={name}
        name={name}
        onBlur={handleBlur}
        onChange={handleChange}
        value={value}
        className={`
          w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500
          ${
            hasErrors && shouldRenderErrors
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-transparent'
          }
          ${className}
        `}
        {...props}
      />{' '}
      {shouldRenderErrors && hasErrors && (
        <div className="space-y-1">
          {fieldErrors.map((error) => (
            <p key={error} className="text-sm text-red-600">
              {error}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
