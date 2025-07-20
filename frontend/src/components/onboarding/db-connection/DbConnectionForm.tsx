'use client';
import { Text } from '@/components/ui/Text';
import { Button, Card, Input, Switch, Textarea } from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

const dbConnectionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  host: z.string().min(1, 'Host is required'),
  port: z
    .string()
    .regex(/^\d+$/, 'Port must be a number')
    .refine((val) => {
      const num = Number(val);
      return num >= 1 && num <= 65535;
    }, 'Port must be between 1 and 65535'),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  database: z.string().min(1, 'Database name is required'),
  ssl: z.boolean(),
  aboutYourBusiness: z
    .string()
    .min(10, 'Please provide at least 10 characters about your business'),
});

type DbConnectionFormData = z.infer<typeof dbConnectionSchema>;

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
      <Card className="!p-5 w-full xl:w-4/5 ">
        <Text variant={'titleLarge'} weight={'bold'}>
          Database Connection
        </Text>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-5">
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                label="Title"
                color="primary"
                variant="bordered"
                radius="lg"
                placeholder="Enter a title for your connection"
                isInvalid={!!errors.title}
                errorMessage={errors.title?.message}
              />
            )}
          />
          <div className="grid grid-cols-2 gap-x-5 gap-y-4 mt-5">
            <Controller
              name="host"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  label="Host"
                  color="primary"
                  variant="bordered"
                  radius="lg"
                  placeholder="Database host (e.g., localhost)"
                  isInvalid={!!errors.host}
                  errorMessage={errors.host?.message}
                />
              )}
            />
            <Controller
              name="port"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  label="Port"
                  color="primary"
                  variant="bordered"
                  radius="lg"
                  placeholder="Database port (e.g., 5432)"
                  isInvalid={!!errors.port}
                  errorMessage={errors.port?.message}
                />
              )}
            />
            <Controller
              name="username"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  label="Username"
                  color="primary"
                  variant="bordered"
                  radius="lg"
                  placeholder="Database username"
                  isInvalid={!!errors.username}
                  errorMessage={errors.username?.message}
                />
              )}
            />
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="text"
                  label="Password"
                  color="primary"
                  variant="bordered"
                  radius="lg"
                  placeholder="Database password"
                  isInvalid={!!errors.password}
                  errorMessage={errors.password?.message}
                />
              )}
            />
            <Controller
              name="database"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  label="Database Name"
                  color="primary"
                  variant="bordered"
                  radius="lg"
                  placeholder="Name of the database to connect to"
                  isInvalid={!!errors.database}
                  errorMessage={errors.database?.message}
                />
              )}
            />
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
          <Controller
            name="aboutYourBusiness"
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                label="About Your Business"
                color="primary"
                variant="bordered"
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
