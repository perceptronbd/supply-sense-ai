'use client';

import { Text } from '@/components/ui/Text';
import { Button, Card, Input, Switch, Textarea } from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { DB_FIELD_CONFIGS } from '../constant/db-connection';
import { type DbConnectionFormData, dbConnectionSchema } from './schema';

const DbConnectionForm = () => {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DbConnectionFormData>({
    resolver: zodResolver(dbConnectionSchema),
    defaultValues: {
      title: '',
      host: '',
      port: '',
      username: '',
      password: '',
      database: '',
      ssl: false,
      aboutYourBusiness: '',
    },
  });

  const onSubmit = async (data: DbConnectionFormData) => {
    try {
      console.log('Form data:', data);

      // TODO: Implement API call to save database connection
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <div className="place-items-end max-md:mt-5">
      <Card className="!p-5 w-full xl:w-4/5 bg-default-300">
        <Text variant={'titleLarge'} weight={'bold'}>
          Database Connection
        </Text>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-5">
          {/* Title field */}

          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                label="Title"
                color="primary"
                variant="faded"
                radius="lg"
                placeholder="Enter a title for your connection"
                isInvalid={!!errors.title}
                errorMessage={errors.title?.message}
              />
            )}
          />

          {/* Main fields grid */}

          <div className="grid grid-cols-2 gap-x-5 gap-y-4 mt-5">
            {DB_FIELD_CONFIGS.map((fieldConfig) => (
              <Controller
                key={fieldConfig.name}
                name={fieldConfig.name as keyof DbConnectionFormData}
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={typeof field.value === 'string' ? field.value : ''}
                    label={fieldConfig.label}
                    color="primary"
                    variant="faded"
                    radius={fieldConfig.radius as 'md' | 'lg' | 'none' | 'sm' | 'full' | undefined}
                    size={fieldConfig.size as 'sm' | 'md' | 'lg' | undefined}
                    type={fieldConfig.type}
                    placeholder={fieldConfig.placeholder}
                    isInvalid={!!errors[fieldConfig.name as keyof typeof errors]}
                    errorMessage={errors[fieldConfig.name as keyof typeof errors]?.message}
                  />
                )}
              />
            ))}

            {/* SSL Switch */}

            <Controller
              name="ssl"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Switch
                  isSelected={value}
                  onValueChange={onChange}
                  color="primary"
                  className="gap-3"
                  size="sm"
                >
                  SSL Enabled
                </Switch>
              )}
            />
          </div>

          <div className="h-px w-full bg-[#F2F2F226] my-5" />

          {/* About Your Business */}

          <Controller
            name="aboutYourBusiness"
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                label="About Your Business"
                color="primary"
                variant="faded"
                radius="lg"
                size="lg"
                placeholder="Provide a brief detail of the kind of business this database is used for."
                isInvalid={!!errors.aboutYourBusiness}
                errorMessage={errors.aboutYourBusiness?.message}
              />
            )}
          />

          <Button
            type="submit"
            fullWidth
            variant="solid"
            color="primary"
            className="mt-5"
            isLoading={isSubmitting}
            isDisabled={isSubmitting}
          >
            {isSubmitting ? 'Connecting...' : 'Confirm'}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default DbConnectionForm;
