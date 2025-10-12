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
}: RegistrationLayoutProps) {
  return (
    <main className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-2 bg-background">
      {/* Left side — registration form */}
      <section className="flex items-center justify-center p-4 overflow-y-auto">
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

      {/* Right side — welcome section */}
      <AuthWelcomeSection variant="register" />
    </main>
  );
}
