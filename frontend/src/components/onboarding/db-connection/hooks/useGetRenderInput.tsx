import { Input } from '@heroui/react';
import { type Control, Controller, type FieldErrors } from 'react-hook-form';
import type { DbConnectionFormData } from '../schema';

// Helper to render Controller/Input with proper types
type FieldName =
  | 'title'
  | 'aboutYourBusiness'
  | 'connectionString'
  | 'credential.host'
  | 'credential.port'
  | 'credential.username'
  | 'credential.password'
  | 'credential.database'
  | 'credential.ssl';

interface RenderInputProps {
  name: FieldName;
  label: string;
  placeholder: string;
  type?: string;
}

interface IUseGetRenderInputProps {
  control: Control<DbConnectionFormData>;
  errors: FieldErrors<DbConnectionFormData>;
}

export const useGetRenderInput = ({ control, errors }: IUseGetRenderInputProps) => {
  // Helper to extract error and invalid state
  const getError = (name: FieldName): string | undefined => {
    if (name.startsWith('credential.')) {
      const key = name.split('.')[1] as keyof DbConnectionFormData['credential'];
      return (errors.credential?.[key] as { message?: string } | undefined)?.message;
    }

    // @ts-expect-error: dynamic access for top-level error
    return errors[name]?.message;
  };

  const isInvalid = (name: FieldName): boolean => {
    if (name.startsWith('credential.')) {
      const key = name.split('.')[1] as keyof DbConnectionFormData['credential'];
      return !!errors.credential?.[key];
    }

    // @ts-expect-error: dynamic access for top-level error
    return !!errors[name];
  };

  const renderInput = (props: RenderInputProps) => {
    const { name, label, placeholder, type = 'text' } = props;
    return (
      <Controller
        name={name as any}
        control={control}
        render={({ field }) => (
          <Input
            {...field}
            label={label}
            color="primary"
            variant="faded"
            radius="lg"
            placeholder={placeholder}
            type={type}
            isInvalid={isInvalid(name)}
            errorMessage={getError(name)}
          />
        )}
      />
    );
  };

  return {
    renderInput,
  };
};
