import type { SVGProps } from 'react';

export interface LoaderIconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
  className?: string;
}

/**
 * Loading spinner icon component that matches HeroUI's design system
 * Based on HeroUI's button loader animation
 */
export const LoaderIcon = ({
  size = 20,
  color = 'currentColor',
  className = '',
  ...props
}: LoaderIconProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`animate-spin ${className}`}
      {...props}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="31.416"
        strokeDashoffset="31.416"
        className="opacity-25"
      />
      <path
        fill={color}
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        className="opacity-75"
      />
    </svg>
  );
};

/**
 * Predefined size variants to match HeroUI's sizing system
 */
export const LoaderSizes = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

export type LoaderSize = keyof typeof LoaderSizes;

/**
 * Enhanced loader with size variants
 */
export interface LoaderProps extends Omit<LoaderIconProps, 'size'> {
  size?: LoaderSize | number | string;
}

export const Loader = ({ size = 'md', ...props }: LoaderProps) => {
  const sizeValue =
    typeof size === 'string' && size in LoaderSizes ? LoaderSizes[size as LoaderSize] : size;

  return <LoaderIcon size={sizeValue} {...props} />;
};
