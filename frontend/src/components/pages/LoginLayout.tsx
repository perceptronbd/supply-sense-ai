import { LoginFormSection } from '../ui/auth/LoginFormSection';
import { LoginWelcomeSection } from '../ui/auth/LoginWelcomeSection';

interface LoginLayoutProps {
  formData: {
    email: string;
    password: string;
  };
  fieldErrors: Record<string, string[]>;
  wasSubmitted: boolean;
  isLoading: boolean;
  onFieldChange: (name: string, value: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export const LoginLayout = ({
  formData,
  fieldErrors,
  wasSubmitted,
  isLoading,
  onFieldChange,
  onSubmit,
}: LoginLayoutProps) => {
  return (
    <main className="grid w-full min-h-screen grid-cols-1 lg:grid-cols-2 bg-background">
      <LoginWelcomeSection />
      <LoginFormSection
        formData={formData}
        fieldErrors={fieldErrors}
        wasSubmitted={wasSubmitted}
        isLoading={isLoading}
        onFieldChange={onFieldChange}
        onSubmit={onSubmit}
      />
    </main>
  );
};
