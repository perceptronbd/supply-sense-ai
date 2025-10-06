import { LoginFormData, loginSchema } from '@/app/login/page';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { ValidatedInput } from '@/components/ui/ValidatedInput';
import { ROUTE_PATHS } from '@/config/routes';
import Link from 'next/link';

interface LoginFormSectionProps {
  formData: LoginFormData;
  fieldErrors: Record<string, string[]>;
  wasSubmitted: boolean;
  isLoading: boolean;
  onFieldChange: (name: string, value: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export const LoginFormSection = ({
  formData,
  fieldErrors,
  wasSubmitted,
  isLoading,
  onFieldChange,
  onSubmit,
}: LoginFormSectionProps) => {
  return (
    <section className="flex min-h-screen items-center justify-center bg-content2 px-8 py-12 lg:px-20">
      <div className="w-full max-w-md mx-auto space-y-8">
        {/* Sign In Header */}
        <div className="space-y-3">
          <Text variant="headerMedium" weight="bold" className="text-foreground" as="h2">
            Sign In
          </Text>
          <Text variant="bodySmall" color="muted" as="p">
            Let's get you back in.
          </Text>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-6" noValidate>
          <div className="space-y-5">
            <ValidatedInput
              name="email"
              type="email"
              label="Email"
              placeholder="Email address"
              isRequired
              variant="flat"
              labelPlacement="inside"
              fieldSchema={loginSchema.shape.email}
              wasSubmitted={wasSubmitted}
              errors={fieldErrors.email}
              defaultValue={formData.email}
              onValueChange={onFieldChange}
              autoComplete="email"
              autoFocus
              //   classNames={{
              //     label: 'text-primary font-medium text-sm',
              //   }}
            />

            <ValidatedInput
              name="password"
              type="password"
              label="Password"
              placeholder="Enter your password"
              isRequired
              variant="flat"
              labelPlacement="inside"
              fieldSchema={loginSchema.shape.password}
              wasSubmitted={wasSubmitted}
              errors={fieldErrors.password}
              defaultValue={formData.password}
              onValueChange={onFieldChange}
              autoComplete="current-password"
              //   classNames={{
              //     label: 'text-primary font-medium text-sm',
              //   }}
            />
          </div>

          <div className="text-left">
            <Text variant="bodySmall" className="text-default-600" as="span">
              Forgot Password?{' '}
            </Text>
            <Link
              href={ROUTE_PATHS.FORGOT_PASSWORD || '#'}
              className="text-sm text-secondary hover:text-primary underline transition-colors"
            >
              Click here
            </Link>
          </div>

          <Button
            type="submit"
            color="primary"
            className="w-full font-semibold"
            isLoading={isLoading}
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Submit'}
          </Button>
        </form>

        {/* Registration Link */}
        <div className="text-center">
          <Text variant="bodySmall" color="muted" as="span">
            Don't have an account?{' '}
          </Text>
          <Link
            href={ROUTE_PATHS.REGISTER}
            className="text-secondary hover:text-primary underline transition-colors"
          >
            Register your company
          </Link>
        </div>
      </div>
    </section>
  );
};
