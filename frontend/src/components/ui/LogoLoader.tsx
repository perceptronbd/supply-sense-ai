import { LogoIcon } from '@/components/icons/LogoIcon';
import { Text } from '@/components/ui/Text';

interface LogoLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'mono';
  showText?: boolean;
  loadingText?: string;
  animationType?: 'spin' | 'pulse' | 'bounce';
  className?: string;
}

const sizeMap = {
  sm: { icon: 32, text: 'bodySmall' as const },
  md: { icon: 48, text: 'titleMedium' as const },
  lg: { icon: 64, text: 'titleLarge' as const },
};

const colorMap = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  mono: 'text-foreground',
};

const animationMap = {
  spin: 'animate-spin',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
};

export function LogoLoader({
  size = 'md',
  variant = 'primary',
  showText = true,
  loadingText = 'Loading...',
  animationType = 'spin',
  className = '',
}: LogoLoaderProps) {
  const { icon, text } = sizeMap[size];
  const colorClass = colorMap[variant];
  const animationClass = animationMap[animationType];

  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      {/* Animated Logo */}
      <div className={`${animationClass}`}>
        <LogoIcon size={icon} className={colorClass} />
      </div>

      {/* Loading Text */}
      {showText && (
        <div className="flex flex-col items-center gap-2">
          <Text variant={text} weight="semiBold" className={`font-manrope ${colorClass}`} as="div">
            Supply Chain AI
          </Text>
          <Text variant="bodySmall" className="text-foreground-500 animate-pulse" as="div">
            {loadingText}
          </Text>
        </div>
      )}
    </div>
  );
}

export default LogoLoader;
