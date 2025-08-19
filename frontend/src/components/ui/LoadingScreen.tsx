import { LogoIcon } from '@/components/icons/LogoIcon';
import { Text } from '@/components/ui/Text';

interface LoadingScreenProps {
  loadingText?: string;
  variant?: 'primary' | 'secondary' | 'mono';
  showProgress?: boolean;
  progress?: number; // 0-100
}

const colorMap = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  mono: 'text-foreground',
};

export function LoadingScreen({
  loadingText = 'Loading Supply Chain AI...',
  variant = 'primary',
  showProgress = false,
  progress = 0,
}: LoadingScreenProps) {
  const colorClass = colorMap[variant];

  return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-8 p-8">
        {/* Logo with animated background */}
        <div className="relative">
          {/* Animated background circle */}
          <div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 animate-spin"
            style={{ width: '120px', height: '120px', margin: '-10px' }}
          />

          {/* Logo */}
          <div className="relative z-10 p-4">
            <LogoIcon size={80} className={`${colorClass} animate-pulse`} />
          </div>
        </div>

        {/* Brand text */}
        <div className="text-center space-y-3">
          <Text
            variant="headerMedium"
            weight="bold"
            className={`font-manrope ${colorClass}`}
            as="h1"
          >
            Supply Chain AI
          </Text>

          <Text variant="bodyMedium" className="text-foreground-600 animate-pulse" as="p">
            {loadingText}
          </Text>
        </div>

        {/* Progress bar (optional) */}
        {showProgress && (
          <div className="w-64 space-y-2">
            <div className="flex justify-between">
              <Text variant="bodySmall" className="text-foreground-500" as="span">
                Loading...
              </Text>
              <Text variant="bodySmall" className="text-foreground-500" as="span">
                {Math.round(progress)}%
              </Text>
            </div>
            <div className="w-full bg-content2 rounded-full h-2">
              {' '}
              <div
                className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
              />
            </div>
          </div>
        )}

        {/* Animated dots */}
        <div className="flex space-x-2">
          <div
            className={`w-2 h-2 ${colorClass.replace('text-', 'bg-')} rounded-full animate-bounce`}
            style={{ animationDelay: '0ms' }}
          />
          <div
            className={`w-2 h-2 ${colorClass.replace('text-', 'bg-')} rounded-full animate-bounce`}
            style={{ animationDelay: '150ms' }}
          />
          <div
            className={`w-2 h-2 ${colorClass.replace('text-', 'bg-')} rounded-full animate-bounce`}
            style={{ animationDelay: '300ms' }}
          />
        </div>
      </div>
    </div>
  );
}

export default LoadingScreen;
