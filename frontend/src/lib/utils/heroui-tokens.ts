/**
 * HeroUI Semantic Tokens Utility
 *
 * This utility provides consistent access to HeroUI's semantic design tokens
 * to ensure proper theme management and consistency across the application.
 */

export const heroUITokens = {
  // Layout tokens
  layout: {
    fontSize: {
      tiny: 'text-tiny',
      small: 'text-small',
      medium: 'text-medium',
      large: 'text-large',
    },
    radius: {
      small: 'rounded-small',
      medium: 'rounded-medium',
      large: 'rounded-large',
    },
    spacing: {
      small: 'p-2',
      medium: 'p-4',
      large: 'p-6',
    },
  },

  // Color tokens
  colors: {
    // Background colors
    background: 'bg-background',
    foreground: 'text-foreground',

    // Content surfaces
    content: {
      1: 'bg-content1',
      2: 'bg-content2',
      3: 'bg-content3',
      4: 'bg-content4',
    },

    // Text colors
    text: {
      default: 'text-foreground',
      muted: 'text-default-500',
      primary: 'text-primary',
      secondary: 'text-secondary',
      success: 'text-success',
      warning: 'text-warning',
      danger: 'text-danger',
      inverse: 'text-primary-foreground',
    },

    // Border colors
    border: {
      default: 'border-divider',
      primary: 'border-primary',
      secondary: 'border-secondary',
      success: 'border-success',
      warning: 'border-warning',
      danger: 'border-danger',
    },
  },

  // Component-specific tokens
  components: {
    card: {
      base: 'bg-content1 border border-divider shadow-small',
      elevated: 'bg-content1 border border-divider shadow-medium',
      interactive:
        'bg-content1 border border-divider shadow-small hover:shadow-medium transition-shadow',
    },

    input: {
      base: 'bg-content2 border-divider text-foreground',
      focused: 'border-primary',
      error: 'border-danger',
    },

    button: {
      primary: 'bg-primary text-primary-foreground',
      secondary: 'bg-secondary text-secondary-foreground',
      ghost: 'bg-transparent hover:bg-content2',
    },
  },

  // Shadow tokens
  shadows: {
    small: 'shadow-small',
    medium: 'shadow-medium',
    large: 'shadow-large',
  },

  // Animation tokens
  transitions: {
    fast: 'transition-colors duration-150',
    normal: 'transition-colors duration-300',
    slow: 'transition-all duration-500',
  },
} as const;

/**
 * Helper function to combine HeroUI tokens with custom classes
 */
export function heroUIClass(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Common component class patterns using HeroUI tokens
 */
export const heroUIPatterns = {
  // Layout patterns
  page: `min-h-screen ${heroUITokens.colors.background} ${heroUITokens.colors.text.default}`,
  container: 'max-w-7xl mx-auto p-6',
  section: 'space-y-6',

  // Card patterns
  cardDefault: heroUITokens.components.card.base,
  cardElevated: heroUITokens.components.card.elevated,
  cardInteractive: heroUITokens.components.card.interactive,

  // Form patterns
  formField: 'space-y-2',
  formLabel: `${heroUITokens.colors.text.default} font-medium text-small`,
  formError: `${heroUITokens.colors.text.danger} text-tiny`,

  // Navigation patterns
  navItem: `${heroUITokens.transitions.normal} rounded-medium px-3 py-2`,
  navItemActive: `${heroUITokens.colors.text.primary} bg-primary/10`,
  navItemInactive: `${heroUITokens.colors.text.default} hover:bg-content2`,

  // Content patterns
  heading: `${heroUITokens.colors.text.default} font-semibold`,
  body: `${heroUITokens.colors.text.default}`,
  caption: `${heroUITokens.colors.text.muted} text-small`,

  // Interactive patterns
  buttonPrimary: `${heroUITokens.components.button.primary} ${heroUITokens.transitions.fast}`,
  buttonSecondary: `${heroUITokens.components.button.secondary} ${heroUITokens.transitions.fast}`,
  buttonGhost: `${heroUITokens.components.button.ghost} ${heroUITokens.transitions.fast}`,
} as const;
