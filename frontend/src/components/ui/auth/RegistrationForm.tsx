import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { ValidatedInput } from '@/components/ui/ValidatedInput';
import { ROUTE_PATHS } from '@/config/routes';
import { registrationFieldSchemas } from '@/lib/schemas/registration.schema';
import { Card, CardBody } from '@heroui/react';
import Link from 'next/link';

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
}: RegistrationFormProps) {
  return (
    <Card radius="sm" className=" h-full">
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
            <Text variant="bodyBase" weight="semiBold" as="h2" className="mb-4">
              Company information
            </Text>
            <div className="space-y-4">
              <ValidatedInput
                size="sm"
                name="companyName"
                label="Company Name"
                placeholder="Enter Your Company Name"
                variant="flat"
                color="primary"
                fieldSchema={registrationFieldSchemas.companyName}
                wasSubmitted={wasSubmitted}
                errors={fieldErrors.companyName}
                onValueChange={onFieldChange}
                isRequired
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ValidatedInput
                  name="companyEmail"
                  label="Company Email"
                  type="email"
                  placeholder="Company Email address"
                  variant="bordered"
                  color="primary"
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
                  variant="bordered"
                  color="primary"
                  fieldSchema={registrationFieldSchemas.contactPhone}
                  wasSubmitted={wasSubmitted}
                  errors={fieldErrors.contactPhone}
                  onValueChange={onFieldChange}
                  isRequired
                />
              </div>

              <ValidatedInput
                name="taxId"
                label="Tax ID/ Business Registration"
                placeholder="123-456-789"
                variant="bordered"
                color="primary"
                fieldSchema={registrationFieldSchemas.taxId}
                wasSubmitted={wasSubmitted}
                errors={fieldErrors.taxId}
                onValueChange={onFieldChange}
              />

              <ValidatedInput
                name="businessAddress"
                label="Company Address"
                placeholder="132 Business St, City, State 1234"
                variant="bordered"
                color="primary"
                fieldSchema={registrationFieldSchemas.businessAddress}
                wasSubmitted={wasSubmitted}
                errors={fieldErrors.businessAddress}
                onValueChange={onFieldChange}
              />

              <ValidatedInput
                name="industry"
                label="Industry"
                placeholder="Food & Beverage Manufacturing"
                variant="bordered"
                color="primary"
                fieldSchema={registrationFieldSchemas.industry}
                wasSubmitted={wasSubmitted}
                errors={fieldErrors.industry}
                onValueChange={onFieldChange}
                isRequired
              />
            </div>
          </section>

          {/* User Information Section */}
          <section>
            <Text variant="bodyBase" weight="semiBold" as="h2" className="mb-4">
              Administrator Account
            </Text>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ValidatedInput
                  name="firstName"
                  label="First name"
                  placeholder="John"
                  variant="bordered"
                  color="primary"
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
                  variant="bordered"
                  color="primary"
                  fieldSchema={registrationFieldSchemas.lastName}
                  wasSubmitted={wasSubmitted}
                  errors={fieldErrors.lastName}
                  onValueChange={onFieldChange}
                  isRequired
                />
              </div>

              <ValidatedInput
                name="email"
                label="Email Adress"
                type="email"
                placeholder="john.doe@yourcompany.com"
                variant="bordered"
                color="primary"
                fieldSchema={registrationFieldSchemas.email}
                wasSubmitted={wasSubmitted}
                errors={fieldErrors.email}
                onValueChange={onFieldChange}
                isRequired
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ValidatedInput
                  name="password"
                  label="Password"
                  type="password"
                  placeholder="Enter a secure password"
                  variant="bordered"
                  color="primary"
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
                  variant="bordered"
                  color="primary"
                  fieldSchema={registrationFieldSchemas.confirmPassword}
                  wasSubmitted={wasSubmitted}
                  errors={fieldErrors.confirmPassword}
                  onValueChange={onFieldChange}
                  isRequired
                />
              </div>
            </div>
          </section>

          {/* Submit Button */}
          <div className="flex justify-center">
            <Button type="submit" size="md" color="primary" isLoading={isLoading} className="w-4/5">
              {isLoading ? 'Creating Account...' : 'Submit'}
            </Button>
          </div>

          {/* Sign In Link */}
          <div className="text-center">
            <Text variant="bodySmall" color="muted">
              Already have an account?{' '}
              <Link href={ROUTE_PATHS.LOGIN} className="underline text-secondary">
                Please Login
              </Link>
            </Text>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
