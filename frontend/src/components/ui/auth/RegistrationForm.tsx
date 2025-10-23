import { Card, CardBody } from '@heroui/react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { ValidatedInput } from '@/components/ui/ValidatedInput';
import { ROUTE_PATHS } from '@/config/routes';
import { registrationFieldSchemas } from '@/lib/schemas/registration.schema';

interface RegistrationFormProps {
  fieldErrors: Record<string, string[]>;
  wasSubmitted: boolean;
  isLoading: boolean;
  onFieldChange: (name: string, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function RegistrationForm({
  fieldErrors,
  wasSubmitted,
  isLoading,
  onFieldChange,
  onSubmit,
}: Readonly<RegistrationFormProps>) {
  return (
    <Card radius="sm" className="h-full bg-default-300">
      <CardBody className="p-8">
        <header className="mb-8">
          <Text variant="headerMedium" weight="bold" as="h1">
            Sign Up
          </Text>
          <Text variant="bodySmall" color="secondary" className="mt-2">
            Start your 30 days free trial today!
          </Text>
        </header>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Company Information Section */}
          <section>
            <Text variant="bodyBase" weight="semiBold" as="h2" className="mb-2">
              Company Information
            </Text>
            <article className="space-y-4">
              <ValidatedInput
                name="companyName"
                label="Company Name"
                placeholder="Enter Your Company Name"
                variant="faded"
                color="primary"
                size="sm"
                fieldSchema={registrationFieldSchemas.companyName}
                wasSubmitted={wasSubmitted}
                errors={fieldErrors.companyName}
                onValueChange={onFieldChange}
                isRequired
              />

              <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ValidatedInput
                  name="companyEmail"
                  label="Company Email"
                  type="email"
                  placeholder="Company Email address"
                  variant="faded"
                  color="primary"
                  size="sm"
                  fieldSchema={registrationFieldSchemas.companyEmail}
                  wasSubmitted={wasSubmitted}
                  errors={fieldErrors.companyEmail}
                  onValueChange={onFieldChange}
                  isRequired
                />

                <ValidatedInput
                  name="contactPhone"
                  label="Contact"
                  type="tel"
                  placeholder="+1-555-123-456"
                  variant="faded"
                  color="primary"
                  size="sm"
                  fieldSchema={registrationFieldSchemas.contactPhone}
                  wasSubmitted={wasSubmitted}
                  errors={fieldErrors.contactPhone}
                  onValueChange={onFieldChange}
                  isRequired
                />
              </section>

              <ValidatedInput
                name="taxId"
                label="Tax ID/ Business Registration"
                placeholder="123-456-789"
                variant="faded"
                color="primary"
                size="sm"
                fieldSchema={registrationFieldSchemas.taxId}
                wasSubmitted={wasSubmitted}
                errors={fieldErrors.taxId}
                onValueChange={onFieldChange}
              />

              <ValidatedInput
                name="businessAddress"
                label="Company Address"
                placeholder="132 Business St, City, State 1234"
                variant="faded"
                color="primary"
                size="sm"
                fieldSchema={registrationFieldSchemas.businessAddress}
                wasSubmitted={wasSubmitted}
                errors={fieldErrors.businessAddress}
                onValueChange={onFieldChange}
              />

              <ValidatedInput
                name="industry"
                label="Industry"
                placeholder="Food & Beverage Manufacturing"
                variant="faded"
                color="primary"
                size="sm"
                fieldSchema={registrationFieldSchemas.industry}
                wasSubmitted={wasSubmitted}
                errors={fieldErrors.industry}
                onValueChange={onFieldChange}
                isRequired
              />
            </article>
          </section>

          {/* User Information Section */}
          <section>
            <Text variant="bodyBase" weight="semiBold" as="h2" className="mb-2">
              Administrator Account
            </Text>
            <article className="space-y-4">
              <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ValidatedInput
                  name="firstName"
                  label="First name"
                  placeholder="John"
                  variant="faded"
                  color="primary"
                  size="sm"
                  fieldSchema={registrationFieldSchemas.firstName}
                  wasSubmitted={wasSubmitted}
                  errors={fieldErrors.firstName}
                  onValueChange={onFieldChange}
                  isRequired
                />

                <ValidatedInput
                  name="lastName"
                  label="Last Name"
                  placeholder="Doe"
                  variant="faded"
                  color="primary"
                  size="sm"
                  fieldSchema={registrationFieldSchemas.lastName}
                  wasSubmitted={wasSubmitted}
                  errors={fieldErrors.lastName}
                  onValueChange={onFieldChange}
                  isRequired
                />
              </section>

              <ValidatedInput
                name="email"
                label="Email Address"
                type="email"
                placeholder="john.doe@yourcompany.com"
                variant="faded"
                color="primary"
                size="sm"
                fieldSchema={registrationFieldSchemas.email}
                wasSubmitted={wasSubmitted}
                errors={fieldErrors.email}
                onValueChange={onFieldChange}
                isRequired
              />

              <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ValidatedInput
                  name="password"
                  label="Password"
                  type="password"
                  placeholder="Enter a secure password"
                  variant="faded"
                  color="primary"
                  size="sm"
                  fieldSchema={registrationFieldSchemas.password}
                  wasSubmitted={wasSubmitted}
                  errors={fieldErrors.password}
                  onValueChange={onFieldChange}
                  isRequired
                />

                <ValidatedInput
                  name="confirmPassword"
                  label="Confirm password"
                  type="password"
                  placeholder="Confirm your password"
                  variant="faded"
                  color="primary"
                  size="sm"
                  fieldSchema={registrationFieldSchemas.confirmPassword}
                  wasSubmitted={wasSubmitted}
                  errors={fieldErrors.confirmPassword}
                  onValueChange={onFieldChange}
                  isRequired
                />
              </section>
            </article>
          </section>

          {/* Submit Button */}
          <footer className="flex justify-center">
            <Button type="submit" size="md" color="primary" isLoading={isLoading} className="w-4/5">
              {isLoading ? 'Creating Account...' : 'Submit'}
            </Button>
          </footer>

          {/* Sign In Link */}
          <footer className="text-center">
            <Text variant="bodySmall" color="muted">
              Already have an account?{' '}
              <Link href={ROUTE_PATHS.LOGIN} className="underline text-secondary">
                Please Login
              </Link>
            </Text>
          </footer>
        </form>
      </CardBody>
    </Card>
  );
}
