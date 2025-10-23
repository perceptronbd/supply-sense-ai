import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/utils';
import { LogoWithName } from '../LogoWithName';

interface AuthWelcomeSectionProps {
  variant: 'login' | 'register';
  className?: string;
}

export function AuthWelcomeSection({ variant, className }: Readonly<AuthWelcomeSectionProps>) {
  const isLogin = variant === 'login';

  return (
    <section
      className={cn(
        'flex h-screen w-full items-center justify-center bg-background px-6',
        className
      )}
    >
      <div className="grid h-full place-items-center">
        <div className={cn('mx-auto', variant === 'login' ? 'max-w-[550px]' : 'max-w-[475px]')}>
          {/* Logo and Brand */}
          <div className="mb-10">
            <LogoWithName width={300} height={44} />
          </div>

          {/* Welcome Message */}
          <div className="space-y-4">
            <Text
              variant="display"
              weight="semiBold"
              className="text-secondary font-clash-display text-[48px] leading-[1.1]"
              as="h1"
            >
              {isLogin ? 'Welcome Back!' : 'Welcome to SupplySense'}
            </Text>
            <Text variant="titleMedium" className="text-foreground-700">
              {isLogin ? (
                <>
                  Sign In to Your{' '}
                  <Text as="span" color="primary" className="font-semibold">
                    Supply Sense
                  </Text>{' '}
                  Account.
                </>
              ) : (
                <>
                  Your Dedicated{' '}
                  <Text as="span" color="primary" className="font-semibold">
                    Chat Agent
                  </Text>{' '}
                  for Your Business.
                </>
              )}
            </Text>
          </div>
        </div>
      </div>
    </section>
  );
}
