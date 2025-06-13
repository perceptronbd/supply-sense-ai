import { Button as HeroUIButton, type ButtonProps as HeroUIButtonProps } from '@heroui/react';
import { forwardRef } from 'react';
import { InlineLoading } from './Loading';

export interface ButtonProps extends HeroUIButtonProps {
  /** Whether the button is in loading state */
  isLoading?: boolean;
  /** Custom loading text to show when loading */
  loadingText?: string;
  /** Size of the loading spinner */
  loadingSize?: 'xs' | 'sm' | 'md' | 'lg';
}

/**
 * Enhanced Button component that extends HeroUI Button with loading state
 * Uses our custom LoaderIcon for consistent loading animations
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ isLoading = false, loadingText, loadingSize = 'sm', children, disabled, ...props }, ref) => {
    // Determine the content to show
    const content = isLoading && loadingText ? loadingText : children;

    return (
      <HeroUIButton ref={ref} disabled={disabled || isLoading} {...props}>
        <span className="flex items-center justify-center gap-2">
          {isLoading && <InlineLoading isLoading={true} size={loadingSize} color="currentColor" />}
          {content}
        </span>
      </HeroUIButton>
    );
  }
);

Button.displayName = 'Button';
