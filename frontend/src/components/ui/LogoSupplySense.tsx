import type { HtmlHTMLAttributes } from 'react';
import { Icons } from '@/lib/icons/Icons';
import { cn } from '@/lib/utils';

interface IProps extends HtmlHTMLAttributes<HTMLDivElement> {
  logoIconClassName?: string;
  supplySenseIconClassName?: string;
}

const LogoSupplySense = ({
  className,
  logoIconClassName,
  supplySenseIconClassName,
  ...rest
}: IProps) => {
  return (
    <div className={cn('flex items-center gap-3.5', className)} {...rest}>
      <Icons.Logo className={cn('size-8', logoIconClassName)} />
      <Icons.SupplySense className={cn(supplySenseIconClassName)} />
    </div>
  );
};

export default LogoSupplySense;
