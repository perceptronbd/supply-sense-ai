import { type VariantProps, cva } from 'class-variance-authority';
import React from 'react';
import { cn } from '../../lib/utils/cn';

const textVariants = cva('leading-6', {
  variants: {
    variant: {
      display: 'text-9xl',
      headerLarge: 'text-5xl lg:text-8xl',
      headerMedium: 'text-4xl  lg:text-6xl',
      headerSmall: 'text-3xl  lg:text-4xl',
      titleLarge: 'text-xl md:text-2xl lg:text-3xl',
      titleMedium: 'text-md md:text-lg',
      titleSmall: 'text-lg md:text-xl',
      bodyLarge: 'text-lg',
      bodyMedium: 'text-md',
      bodyBase: 'text-base',
      bodySmall: 'text-sm',
      bodyXSmall: 'text-xs',
      body2XSmall: 'text-2xs',
      body3XSmall: 'text-3xs',
    },
    weight: {
      bold: 'font-bold',
      semiBold: 'font-semibold',
      medium: 'font-medium',
      normal: 'font-normal',
      thin: 'font-thin',
    },
  },
  defaultVariants: {
    variant: 'bodyMedium',
    weight: 'normal',
  },
});

interface TextProps extends VariantProps<typeof textVariants> {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
}

export const Text = ({ variant, weight, children, className, style, as }: TextProps) => {
  const classes = cn(textVariants({ variant, weight }), className);

  // Determine the element based on `as` prop or variant
  const getElementType = (): 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div' => {
    if (as) return as;

    switch (variant) {
      case 'display':
      case 'headerLarge':
        return 'h1';
      case 'headerMedium':
        return 'h2';
      case 'headerSmall':
        return 'h3';
      case 'titleLarge':
        return 'h4';
      case 'titleMedium':
        return 'h5';
      case 'titleSmall':
        return 'h6';
      default:
        return 'p';
    }
  };

  const elementType = getElementType();
  const props = { className: classes, style };

  switch (elementType) {
    case 'h1':
      return <h1 {...props}>{children}</h1>;
    case 'h2':
      return <h2 {...props}>{children}</h2>;
    case 'h3':
      return <h3 {...props}>{children}</h3>;
    case 'h4':
      return <h4 {...props}>{children}</h4>;
    case 'h5':
      return <h5 {...props}>{children}</h5>;
    case 'h6':
      return <h6 {...props}>{children}</h6>;
    case 'span':
      return <span {...props}>{children}</span>;
    case 'div':
      return <div {...props}>{children}</div>;
    default:
      return <p {...props}>{children}</p>;
  }
};
