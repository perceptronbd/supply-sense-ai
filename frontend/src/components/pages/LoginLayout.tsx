import { Card, CardBody } from '@heroui/react';
import { useEffect, useState } from 'react';
import { AuthWelcomeSection } from '../ui/auth/AuthWelcomeSection';
import { LoginForm } from '../ui/auth/LoginForm';

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
  const [showSplash, setshowSplash] = useState(true);

  // Set timer to hide splash screen after 1 second
  useEffect(() => {
    const timer = setTimeout(() => {
      setshowSplash(false);
    }, 1000);

    // Clear the timer if the component unmounts
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="grid w-full min-h-screen grid-cols-1 lg:grid-cols-2 bg-background">
      {/* Left panel (Splash) */}
      <AuthWelcomeSection variant="login" className={showSplash ? 'block' : 'hidden lg:block'} />

      {/* Right panel (Main Content) */}
      <section
        className={`
          ${showSplash ? 'hidden' : 'flex'}
          lg:flex items-center justify-center p-4 overflow-y-auto
        `}
      >
        <Card radius="sm" className="w-full h-full bg-default-300">
          <CardBody className="p-8 flex items-center justify-center">
            <LoginForm
              formData={formData}
              fieldErrors={fieldErrors}
              wasSubmitted={wasSubmitted}
              isLoading={isLoading}
              onFieldChange={onFieldChange}
              onSubmit={onSubmit}
            />
          </CardBody>
        </Card>
      </section>
    </main>
  );
};
