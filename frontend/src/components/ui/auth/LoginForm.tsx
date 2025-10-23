import Link from 'next/link';
import { LoginFormData, loginSchema } from '@/app/login/page';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { ValidatedInput } from '@/components/ui/ValidatedInput';
import { ROUTE_PATHS } from '@/config/routes';

interface LoginFormProps {
  formData: LoginFormData;
  fieldErrors: Record<string, string[]>;
  wasSubmitted: boolean;
  isLoading: boolean;
  onFieldChange: (name: string, value: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export const LoginForm = ({
  formData,
  fieldErrors,
  wasSubmitted,
  isLoading,
  onFieldChange,
  onSubmit,
}: LoginFormProps) => {
  return (
    <section className="w-full max-w-md mx-auto space-y-8">
      {/* Header */}
      <header className="space-y-3 sm:text-left">
        <Text variant="headerMedium" weight="bold" className="text-foreground" as="h2">
          Sign In
        </Text>
        <Text variant="bodySmall" color="secondary" as="p">
          Let's get you back in.
        </Text>
      </header>

      {/* Form */}
      <form onSubmit={onSubmit} className="space-y-6" noValidate>
        <fieldset className="space-y-5">
          <ValidatedInput
            name="email"
            type="email"
            label="Email"
            placeholder="Email address"
            color="primary"
            radius="md"
            isRequired
            size="md"
            variant="faded"
            labelPlacement="inside"
            fieldSchema={loginSchema.shape.email}
            wasSubmitted={wasSubmitted}
            errors={fieldErrors.email}
            defaultValue={formData.email}
            onValueChange={onFieldChange}
            autoComplete="email"
            autoFocus
          />

          <ValidatedInput
            name="password"
            type="password"
            label="Password"
            placeholder="Enter your password"
            color="primary"
            radius="md"
            isRequired
            variant="faded"
            labelPlacement="inside"
            size="md"
            fieldSchema={loginSchema.shape.password}
            wasSubmitted={wasSubmitted}
            errors={fieldErrors.password}
            defaultValue={formData.password}
            onValueChange={onFieldChange}
            autoComplete="current-password"
          />
        </fieldset>

        <p className="text-left">
          <Text variant="bodySmall" className="text-default-600" as="span">
            Forgot Password?{' '}
          </Text>
          <Link
            href={ROUTE_PATHS.FORGOT_PASSWORD || '#'}
            className="text-sm text-secondary hover:text-primary underline transition-colors"
          >
            Click here
          </Link>
        </p>

        <Button
          type="submit"
          color="primary"
          className="w-full font-semibold"
          isLoading={isLoading}
          size="md"
          radius="md"
          disabled={isLoading}
        >
          {isLoading ? 'Signing in...' : 'Submit'}
        </Button>
      </form>

      {/* Footer */}
      <footer className="text-center">
        <Text variant="bodySmall" color="muted" as="span">
          Don't have an account?{' '}
        </Text>
        <Link
          href={ROUTE_PATHS.REGISTER}
          className="text-secondary hover:text-primary underline transition-colors"
        >
          Register your company
        </Link>
      </footer>
    </section>
  );
};
