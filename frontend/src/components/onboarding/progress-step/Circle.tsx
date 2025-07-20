import { cn } from '@/lib/utils';

interface IProps {
  variant?: 'inactive' | 'active';
  className?: string;
}

const Circle = ({ variant, className }: IProps) => {
  return (
    <div
      className={cn(
        'border rounded-full size-7 grid place-items-center bg-background relative z-30',
        variant === 'active' ? 'border-primary' : 'border-default-500',
        className
      )}
    >
      <div
        className={cn(
          'size-5 rounded-full',
          variant === 'active' && 'bg-primary',
          variant === 'inactive' && 'border border-default-500'
        )}
      />
    </div>
  );
};

export default Circle;
