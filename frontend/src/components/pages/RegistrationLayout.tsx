import { useEffect, useState } from 'react';
import { AuthWelcomeSection } from '../ui/auth/AuthWelcomeSection';
import { RegistrationForm } from '../ui/auth/RegistrationForm';

interface RegistrationLayoutProps {
  fieldErrors: Record<string, string[]>;
  wasSubmitted: boolean;
  isLoading: boolean;
  onFieldChange: (name: string, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function RegistrationLayout({
  fieldErrors,
  wasSubmitted,
  isLoading,
  onFieldChange,
  onSubmit,
}: Readonly<RegistrationLayoutProps>) {
  const [showSplash, setshowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setshowSplash(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-2 bg-background">
      {/* Right side — welcome section */}
      <AuthWelcomeSection
        variant="register"
        className={`
          ${showSplash ? 'block' : 'hidden'}
          lg:block lg:order-last
        `}
      />

      {/* Left side — registration form */}
      <section
        className={`
          ${showSplash ? 'hidden' : 'flex'}
          lg:flex items-center justify-center p-4 overflow-y-auto lg:order-first
        `}
      >
        <aside className="w-full">
          <RegistrationForm
            fieldErrors={fieldErrors}
            wasSubmitted={wasSubmitted}
            isLoading={isLoading}
            onFieldChange={onFieldChange}
            onSubmit={onSubmit}
          />
        </aside>
      </section>
    </main>
  );
}
