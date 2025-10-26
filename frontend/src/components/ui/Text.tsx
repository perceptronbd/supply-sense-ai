import { cva, type VariantProps } from 'class-variance-authority';
import React from 'react';
import { cn } from '@/lib/utils/cn';

const textVariants = cva('', {
  variants: {
    variant: {
      // Professional heading variants for supply chain context
      display: 'text-5xl lg:text-7xl font-clash-display font-bold tracking-tight',
      headerLarge: 'text-4xl lg:text-6xl font-clash-display font-bold tracking-tight',
      headerMedium: 'text-3xl lg:text-5xl font-clash-display font-semibold tracking-tight',
      headerSmall: 'text-2xl lg:text-4xl font-clash-display font-semibold tracking-tight',
      titleLarge: 'text-xl lg:text-3xl font-clash-display font-semibold',
      titleMedium: 'text-lg lg:text-2xl font-clash-display font-medium',
      titleSmall: 'text-base lg:text-xl font-clash-display font-medium',
      // Body variants optimized for data-heavy interfaces
      bodyLarge: 'text-large font-montserrat  leading-large',
      bodyMedium: 'text-lg  font-montserrat leading-medium',
      bodyBase: 'text-base  font-montserrat leading-medium',
      bodySmall: 'text-sm font-montserrat  leading-small',
      bodyXSmall: 'text-xs font-montserrat leading-tiny',
      caption: 'text-xs font-montserrat  leading-tiny',
      label: 'text-sm  font-montserrat leading-small font-medium',
      // Special variants for supply chain data
      data: 'text-sm font-data tabular-nums leading-small',
      code: 'text-sm font-mono leading-small',
    },
    weight: {
      bold: 'font-bold',
      semiBold: 'font-semibold',
      medium: 'font-medium',
      normal: 'font-normal',
      light: 'font-light',
    },
    color: {
      default: 'text-foreground',
      primary: 'text-primary',
      secondary: 'text-secondary',
      success: 'text-success',
      warning: 'text-warning',
      danger: 'text-danger',
      muted: 'text-default-500',
      inverse: 'text-primary-foreground',
    },
  },
  defaultVariants: {
    variant: 'bodyMedium',
    weight: 'normal',
    color: 'default',
  },
});

interface TextProps extends VariantProps<typeof textVariants> {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div' | 'label' | 'time';
  fontFace?: 'primary' | 'secondary';
}

export const Text = ({
  variant,
  weight,
  color,
  children,
  className,
  style,
  as,
  fontFace = 'primary',
  ...otherProps
}: TextProps & React.HTMLAttributes<HTMLElement>) => {
  // Determine font class for display variant and fontFace
  let fontClass = '';
  if (variant === 'display') {
    fontClass = fontFace === 'primary' ? 'font-clash-display' : 'font-manrope';
  }

  const classes = cn(textVariants({ variant, weight, color }), fontClass, className);

  // Determine the element based on `as` prop or variant
  const getElementType = ():
    | 'h1'
    | 'h2'
    | 'h3'
    | 'h4'
    | 'h5'
    | 'h6'
    | 'p'
    | 'span'
    | 'div'
    | 'label'
    | 'time' => {
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
      case 'label':
        return 'label';
      default:
        return 'p';
    }
  };

  const elementType = getElementType();
  const props = { className: classes, style, ...otherProps };

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
    case 'label':
      // biome-ignore lint/a11y/noLabelWithoutControl: This is a flexible text component that may be used for display purposes
      return <label {...props}>{children}</label>;
    case 'span':
      return <span {...props}>{children}</span>;
    case 'div':
      return <div {...props}>{children}</div>;
    case 'time':
      return <time {...props}>{children}</time>;
    default:
      return <p {...props}>{children}</p>;
  }
};
