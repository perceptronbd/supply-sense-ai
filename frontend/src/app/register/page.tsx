'use client';

import { addToast, Card, CardBody } from '@heroui/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LogoIcon } from '@/components/icons/LogoIcon';
import { SupplySenseTextIcon } from '@/components/icons/SupplySenseTextIcon';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { ValidatedInput } from '@/components/ui/ValidatedInput';
import { ROUTE_PATHS } from '@/config/routes';
import {
  type RegistrationFormData,
  registrationFieldSchemas,
  registrationSchema,
} from '@/lib/schemas/registration.schema';
import { getToastErrorMessage } from '@/lib/utils/api-response';
import { useRegisterMutation } from '@/store/api/authApi';
import { useAppDispatch } from '@/store/hooks';
import { setRegistrationCredentials } from '@/store/slices/authSlice';

export default function RegisterPage() {
  const [formData, setFormData] = useState<RegistrationFormData>({
    companyName: '',
    companyEmail: '',
    industry: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    taxId: '',
    businessAddress: '',
    contactPhone: '',
  });
  const [wasSubmitted, setWasSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [register, { isLoading }] = useRegisterMutation();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const handleFieldChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear field errors when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: [] }));
    }
  };

  const validateForm = () => {
    const result = registrationSchema.safeParse(formData);
    if (!result.success) {
      const errors: Record<string, string[]> = {};
      for (const error of result.error.errors) {
        const path = error.path[0] as string;
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(error.message);
      }
      setFieldErrors(errors);
      return false;
    }
    setFieldErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWasSubmitted(true);

    if (!validateForm()) {
      return;
    }

    try {
      // Remove confirmPassword from the request data
      const { confirmPassword, ...registrationData } = formData;
      void confirmPassword;

      const result = await register(registrationData).unwrap();
      console.log('🚀 > handleSubmit > result:', result);
      dispatch(setRegistrationCredentials({ company: result.company }));

      addToast({
        title: 'Registration Successful',
        description: `Welcome to SupplySense! Your company "${result.company.name}" has been registered. Please sign in to continue.`,
        color: 'success',
        variant: 'flat',
      });

      // Redirect to sign-in page
      router.push(ROUTE_PATHS.ONBOARDING);
    } catch (error) {
      const toastError = getToastErrorMessage(error);

      addToast({
        title: toastError.title,
        description: toastError.description,
        color: 'danger',
        variant: 'flat',
      });
    }
  };

  return (
    <main className="min-h-screen bg-content2 flex items-center justify-center p-4">
      <div className="w-full h-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 place-items-center h-full">
          {/* Registration Form - Right Side */}
          <section>
            <Card className="shadow-2xl border-0 h-full">
              <CardBody className="p-8">
                <header className="text-center mb-6">
                  <Text variant="headerMedium" as="h3" className="text-foreground mb-2">
                    Create Your Account
                  </Text>
                  <Text variant="bodyBase" as="p" className="text-foreground-600">
                    Start your 30-day free trial today
                  </Text>
                </header>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Company Information Section */}
                  <section>
                    <Text variant="titleMedium" as="h4" className="text-foreground mb-4">
                      Company Information
                    </Text>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ValidatedInput
                        name="companyName"
                        label="Company Name"
                        placeholder="Enter your company name"
                        variant="bordered"
                        fieldSchema={registrationFieldSchemas.companyName}
                        wasSubmitted={wasSubmitted}
                        errors={fieldErrors.companyName}
                        onValueChange={handleFieldChange}
                        isRequired
                        className="md:col-span-2"
                      />

                      <ValidatedInput
                        name="companyEmail"
                        label="Company Email"
                        type="email"
                        placeholder="contact@yourcompany.com"
                        variant="bordered"
                        fieldSchema={registrationFieldSchemas.companyEmail}
                        wasSubmitted={wasSubmitted}
                        errors={fieldErrors.companyEmail}
                        onValueChange={handleFieldChange}
                        isRequired
                      />

                      <ValidatedInput
                        name="industry"
                        label="Industry"
                        placeholder="e.g., Automotive Manufacturing"
                        variant="bordered"
                        fieldSchema={registrationFieldSchemas.industry}
                        wasSubmitted={wasSubmitted}
                        errors={fieldErrors.industry}
                        onValueChange={handleFieldChange}
                        isRequired
                        className="md:col-span-2"
                      />

                      <ValidatedInput
                        name="contactPhone"
                        label="Contact Phone"
                        type="tel"
                        placeholder="+1-555-123-4567"
                        variant="bordered"
                        fieldSchema={registrationFieldSchemas.contactPhone}
                        wasSubmitted={wasSubmitted}
                        errors={fieldErrors.contactPhone}
                        onValueChange={handleFieldChange}
                      />

                      <ValidatedInput
                        name="taxId"
                        label="Tax ID / Business Registration"
                        placeholder="123-45-6789"
                        variant="bordered"
                        fieldSchema={registrationFieldSchemas.taxId}
                        wasSubmitted={wasSubmitted}
                        errors={fieldErrors.taxId}
                        onValueChange={handleFieldChange}
                        className="md:col-span-2"
                      />

                      <ValidatedInput
                        name="businessAddress"
                        label="Business Address"
                        placeholder="123 Business St, City, State 12345"
                        variant="bordered"
                        fieldSchema={registrationFieldSchemas.businessAddress}
                        wasSubmitted={wasSubmitted}
                        errors={fieldErrors.businessAddress}
                        onValueChange={handleFieldChange}
                        className="md:col-span-2"
                      />
                    </div>
                  </section>

                  {/* User Information Section */}
                  <section>
                    <Text variant="titleMedium" as="h4" className="text-foreground mb-4">
                      Administrator Account
                    </Text>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ValidatedInput
                        name="firstName"
                        label="First Name"
                        placeholder="John"
                        variant="bordered"
                        fieldSchema={registrationFieldSchemas.firstName}
                        wasSubmitted={wasSubmitted}
                        errors={fieldErrors.firstName}
                        onValueChange={handleFieldChange}
                        isRequired
                      />

                      <ValidatedInput
                        name="lastName"
                        label="Last Name"
                        placeholder="Doe"
                        variant="bordered"
                        fieldSchema={registrationFieldSchemas.lastName}
                        wasSubmitted={wasSubmitted}
                        errors={fieldErrors.lastName}
                        onValueChange={handleFieldChange}
                        isRequired
                      />

                      <ValidatedInput
                        name="email"
                        label="Your Email Address"
                        type="email"
                        placeholder="john.doe@yourcompany.com"
                        variant="bordered"
                        fieldSchema={registrationFieldSchemas.email}
                        wasSubmitted={wasSubmitted}
                        errors={fieldErrors.email}
                        onValueChange={handleFieldChange}
                        isRequired
                        className="md:col-span-2"
                      />

                      <ValidatedInput
                        name="password"
                        label="Password"
                        type="password"
                        placeholder="Enter a secure password"
                        variant="bordered"
                        fieldSchema={registrationFieldSchemas.password}
                        wasSubmitted={wasSubmitted}
                        errors={fieldErrors.password}
                        onValueChange={handleFieldChange}
                        isRequired
                      />

                      <ValidatedInput
                        name="confirmPassword"
                        label="Confirm Password"
                        type="password"
                        placeholder="Confirm your password"
                        variant="bordered"
                        fieldSchema={registrationFieldSchemas.confirmPassword}
                        wasSubmitted={wasSubmitted}
                        errors={fieldErrors.confirmPassword}
                        onValueChange={handleFieldChange}
                        isRequired
                      />
                    </div>
                  </section>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    color="primary"
                    size="lg"
                    isLoading={isLoading}
                    className="w-full"
                  >
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>

                  {/* Sign In Link */}
                  <div className="text-center">
                    <Text variant="bodySmall" as="p" className="text-foreground-600">
                      Already have an account?{' '}
                      <Link
                        href={ROUTE_PATHS.LOGIN}
                        className="text-secondary-500 hover:text-primary-700 font-medium"
                      >
                        Sign in here
                      </Link>
                    </Text>
                  </div>
                </form>
              </CardBody>
            </Card>
          </section>
          {/* Welcome Section - Left Side */}
          <section className=" w-full flex items-center justify-center">
            <div className="text-center ml-6 lg:text-left space-y-6 max-w-3xl">
              <header>
                <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
                  <LogoIcon className="w-12 h-12" />
                  <SupplySenseTextIcon className="h-10" />
                </div>
                <Text variant="display" as="h1" weight={'bold'} className="text-foreground mb-4">
                  Welcome to SupplySense
                </Text>
                <Text variant="headerSmall" as="h2" className="text-primary-700 mb-6">
                  Your Complete Supply Chain Management Solution
                </Text>
              </header>

              <div className="space-y-4">
                <Text variant="bodyLarge" as="p" className="text-foreground-700">
                  Join companies that trust SupplySense to streamline their operations.
                </Text>

                <ul className="space-y-3 text-left">
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary-500 rounded-full" />
                    <Text variant="bodyMedium" as="span" className="text-foreground-600">
                      Multi-tenant architecture with complete data isolation
                    </Text>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary-500 rounded-full" />
                    <Text variant="bodyMedium" as="span" className="text-foreground-600">
                      AI-powered inventory optimization and forecasting
                    </Text>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary-500 rounded-full" />
                    <Text variant="bodyMedium" as="span" className="text-foreground-600">
                      End-to-end purchase and manufacturing workflows
                    </Text>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary-500 rounded-full" />
                    <Text variant="bodyMedium" as="span" className="text-foreground-600">
                      Real-time collaboration across multiple branches
                    </Text>
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
