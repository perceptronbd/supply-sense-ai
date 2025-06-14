import { DrawingLogo } from '@/components/ui/DrawingLogo';
import { Text } from '@/components/ui/Text';

export interface LoadingProps {
  /** Size of the loading spinner */
  size?: number;
  /** Loading message to display */
  message?: string;
  /** Whether to show the loading message */
  showMessage?: boolean;
  /** Custom className for styling */
  className?: string;
  /** Color variant */
  variant?: 'primary' | 'secondary' | 'mono';
  /** Layout orientation */
  orientation?: 'vertical' | 'horizontal';
}

/**
 * Reusable loading component with consistent styling
 * Follows HeroUI design patterns and semantic color tokens
 */
export const Loading = ({
  size = 60,
  message = 'Loading...',
  showMessage = true,
  className = '',
  variant = 'primary',
  orientation = 'vertical',
}: LoadingProps) => {
  const isVertical = orientation === 'vertical';

  return (
    <div
      className={`
        flex items-center justify-center
        ${isVertical ? 'flex-col space-y-3' : 'flex-row space-x-3'}
        ${className}
      `}
    >
      <DrawingLogo size={size} variant={variant} speed="fast" showFill={true} />
      {showMessage && (
        <Text variant="bodySmall" color="muted" as="span" className="select-none">
          {message}
        </Text>
      )}
    </div>
  );
};

/**
 * Full-screen loading overlay
 */
export interface LoadingOverlayProps extends LoadingProps {
  /** Whether the overlay is visible */
  isVisible?: boolean;
  /** Background opacity */
  opacity?: 'light' | 'medium' | 'heavy';
}

export const LoadingOverlay = ({
  isVisible = true,
  opacity = 'medium',
  size = 80,
  message = 'Loading...',
  ...props
}: LoadingOverlayProps) => {
  if (!isVisible) return null;

  const opacityClasses = {
    light: 'bg-background/60',
    medium: 'bg-background/80',
    heavy: 'bg-background/90',
  };

  return (
    <div
      className={`
        fixed inset-0 z-50 flex items-center justify-center
        ${opacityClasses[opacity]}
        backdrop-blur-sm
      `}
    >
      <div className="bg-content1 rounded-large p-6 border border-divider shadow-large">
        <Loading size={size} message={message} {...props} />
      </div>
    </div>
  );
};

/**
 * Inline loading spinner for buttons and small spaces
 */
export interface InlineLoadingProps extends Omit<LoadingProps, 'orientation' | 'showMessage'> {
  /** Whether to show the spinner */
  isLoading?: boolean;
}

export const InlineLoading = ({
  isLoading = true,
  size = 24,
  variant = 'primary',
  className = '',
}: InlineLoadingProps) => {
  if (!isLoading) return null;

  return (
    <DrawingLogo
      size={size}
      variant={variant}
      speed="fast"
      showFill={true}
      className={`inline-block ${className}`}
    />
  );
};
