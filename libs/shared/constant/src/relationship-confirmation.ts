export const ACTION_BUTTON_VARIANTS = [
  'yes',
  'no',
  'not-sure',
  'uncertain',
  'confirmed',
  'edit',
] as const;

export type TActionButtonVariants = (typeof ACTION_BUTTON_VARIANTS)[number];
