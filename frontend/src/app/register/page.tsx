'use client';

import { addToast } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { RegistrationLayout } from '@/components/pages/RegistrationLayout';
import { ROUTE_PATHS } from '@/config/routes';
import { type RegistrationFormData, registrationSchema } from '@/lib/schemas/registration.schema';
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
      dispatch(
        setRegistrationCredentials({
          company: result.company,
          user: {
            roles: [],
            permissions: [],
            branchId: '',
            isActive: true,
            companyId: result.company.id,
            ...result.user,
          },
        })
      );

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
    <RegistrationLayout
      fieldErrors={fieldErrors}
      wasSubmitted={wasSubmitted}
      isLoading={isLoading}
      onFieldChange={handleFieldChange}
      onSubmit={handleSubmit}
    />
  );
}
