import { Button } from '@/components/ui/Button';
import { Icons } from '@/lib/icons/Icons';

type TVariants = 'yes' | 'no' | 'not-sure';

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
  TVariants,
  { style: TVariantStyles; color: TVariantColors; icon: React.ReactNode }
>;
interface IProps {
  variants: TVariants;
}

const ActionButton = ({ variants }: IProps) => {
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
  };

  return (
    <Button
      className="capitalize size-fit pl-3 pr-4 py-2 text-lg items-center inline-flex"
      variant={buttonConfig[variants].style}
      color={buttonConfig[variants].color}
    >
      <span className="">{buttonConfig[variants].icon}</span> {variants.split('-').join(' ')}
    </Button>
  );
};

export default ActionButton;
