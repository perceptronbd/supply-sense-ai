import { Button as HeroUIButton, type ButtonProps as HeroUIButtonProps } from '@heroui/react';
import { forwardRef } from 'react';

export interface ButtonProps extends HeroUIButtonProps {
  /** Whether the button is in loading state */
  isLoading?: boolean;
  loadingText?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ isLoading = false, loadingText, children, disabled, ...props }, ref) => {
    return (
      <HeroUIButton
        ref={ref}
        isLoading={isLoading}
        disabled={disabled || isLoading}
        spinnerPlacement="start"
        {...(loadingText ? { spinner: loadingText } : {})}
        {...props}
      >
        {children}
      </HeroUIButton>
    );
  }
);

Button.displayName = 'Button';
