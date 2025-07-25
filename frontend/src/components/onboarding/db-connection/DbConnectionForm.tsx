'use client';

import { Text } from '@/components/ui/Text';
import { useDbConnectMutation } from '@/store/api/onboardingApi';
import { Button, Card, Switch, Textarea } from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useCheckHasCredential } from './hooks/useCheckHasCredential';
import { useGetRenderInput } from './hooks/useGetRenderInput';
import { type DbConnectionFormData, dbConnectionSchema } from './schema';
import type { IDbConnectPayload } from './types';

const DbConnectionForm = () => {
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DbConnectionFormData>({
    resolver: zodResolver(dbConnectionSchema),
    defaultValues: {
      title: '',
      credential: {
        host: '',
        port: '',
        username: '',
        password: '',
        database: '',
        sslEnabled: false,
      },
      aboutYourBusiness: '',
      connectionString: '',
    },
  });
  // Use custom hook for error handling
  const { error, checkHasCredentials } = useCheckHasCredential({ watch });

  const { renderInput } = useGetRenderInput({ control, errors });
  console.log('🚀 ~ errors:', errors);

  // Mutation hook for connecting to the database
  const [dbConnect, { isLoading }] = useDbConnectMutation();

  const onSubmit = async (data: DbConnectionFormData) => {
    const hasCredentials = checkHasCredentials(data);
    if (!hasCredentials) return; // Prevent submission if validation fails

    try {
      // Transform form data to API payload
      const payload: IDbConnectPayload = {
        companyId: 'demo-company-id',
      };

      if (data.credential && !data.connectionString) {
        payload.credentials = {
          host: data.credential.host ?? '',
          port: Number(data.credential.port),
          username: data.credential.username ?? '',
          password: data.credential.password ?? '',
          database: data.credential.database ?? '',
          sslEnabled: data.credential.sslEnabled ?? false,
        };
      } else if (data.connectionString && !data.credential) {
        payload.connectionString = data.connectionString;
      }

      const result = await dbConnect(payload).unwrap();
      console.log('🚀 ~ result:', result);
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
          {renderInput({
            name: 'title',
            label: 'Title',
            placeholder: 'Enter a title for your connection',
          })}

          {/* Main fields grid */}
          <div className="grid grid-cols-2 gap-x-5 gap-y-4 mt-5">
            {renderInput({
              name: 'credential.host',
              label: 'Host',
              placeholder: 'Database host',
            })}

            {renderInput({
              name: 'credential.port',
              label: 'Port',
              placeholder: 'Database port',
            })}

            {renderInput({
              name: 'credential.username',
              label: 'Username',
              placeholder: 'Database username',
            })}

            {renderInput({
              name: 'credential.password',
              label: 'Password',
              placeholder: 'Database password',
              type: 'password',
            })}

            {renderInput({
              name: 'credential.database',
              label: 'Database Name',
              placeholder: 'Database name',
            })}

            <Controller
              name="credential.sslEnabled"
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
          <div className="flex items-center gap-3 my-5">
            <div className="h-px flex-1 bg-[#F2F2F226]" />
            <Text className="text-sm text-gray-500 px-2">OR</Text>
            <div className="h-px flex-1 bg-[#F2F2F226]" />
          </div>

          {renderInput({
            name: 'connectionString',
            label: 'Connection String',
            placeholder: 'postgressql://user:password@127.0.0.1:5432/postgresa',
          })}

          {error && (
            <Text variant="bodyXSmall" className="text-danger mt-2 text-xs">
              {error}
            </Text>
          )}

          <Button
            type="submit"
            fullWidth
            variant="solid"
            color="primary"
            className="mt-5"
            isLoading={isSubmitting || isLoading}
            isDisabled={isSubmitting || isLoading}
          >
            {isSubmitting || isLoading ? 'Connecting...' : 'Confirm'}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default DbConnectionForm;
