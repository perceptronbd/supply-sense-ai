import { Icons } from '@/lib/icons/Icons';
import { cn } from '@/lib/utils';

interface IProps {
  variant?: 'inactive' | 'active';
  isComplete?: boolean;
  className?: string;
}

const Circle = ({ variant, className, isComplete }: IProps) => {
  return (
    <div
      className={cn(
        'border rounded-full size-7 grid place-items-center bg-background relative z-30',
        variant === 'active' || isComplete ? 'border-primary' : 'border-default-500',
        className
      )}
    >
      {isComplete ? (
        <Icons.Check className="size-4 text-primary" />
      ) : (
        <div
          className={cn(
            'size-5 rounded-full',
            variant === 'active' && 'bg-primary',
            variant === 'inactive' && 'border border-default-500'
          )}
        />
      )}
    </div>
  );
};

export default Circle;
