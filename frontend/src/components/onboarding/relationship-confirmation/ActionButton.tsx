import { Button, type ButtonProps } from '@/components/ui/Button';
import { Icons } from '@/lib/icons/Icons';

export const ACTION_BUTTON_VARIANTS = [
  'yes',
  'no',
  'not-sure',
  'uncertain',
  'confirmed',
  'edit',
] as const;

export type TActionButtonVariants = (typeof ACTION_BUTTON_VARIANTS)[number];

type TVariantStyles =
  | 'flat'
  | 'solid'
  | 'bordered'
  | 'light'
  | 'faded'
  | 'shadow'
  | 'ghost'
  | undefined;

type TVariantColors =
  | 'success'
  | 'warning'
  | 'default'
  | 'primary'
  | 'secondary'
  | 'danger'
  | undefined;
type TButtonConfig = Record<
  TActionButtonVariants,
  { style: TVariantStyles; color: TVariantColors; icon: React.ReactNode }
>;
interface IProps extends ButtonProps {
  variants: TActionButtonVariants;
}

const ActionButton = ({ variants, ...props }: IProps) => {
  const buttonConfig: TButtonConfig = {
    yes: {
      style: 'flat',
      color: 'success',
      icon: <Icons.CheckCircle />,
    },
    no: {
      style: 'flat',
      color: 'danger',
      icon: <Icons.CrossCircle />,
    },
    'not-sure': {
      style: 'flat',
      color: 'warning',
      icon: <Icons.NotSure className="size-6" />,
    },
    confirmed: {
      style: 'flat',
      color: 'success',
      icon: <Icons.CheckCircle />,
    },
    uncertain: {
      style: 'flat',
      color: 'warning',
      icon: <Icons.InfoCircle className="size-6" />,
    },
    edit: {
      style: 'flat',
      color: 'default',
      icon: <Icons.Edit className="size-6" />,
    },
  };

  return (
    <Button
      className="capitalize  text-lg items-center inline-flex"
      variant={buttonConfig[variants].style}
      color={buttonConfig[variants].color}
      size="sm"
      {...props}
    >
      <span className="">{buttonConfig[variants].icon}</span> {variants.split('-').join(' ')}
    </Button>
  );
};

export default ActionButton;
