import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/utils';
import { Circle } from '.';
interface IProps {
  currentStep: number;
}

const ProgressStep = ({ currentStep }: IProps) => {
  const isActive = (step: number) => step < currentStep || step === currentStep;

  return (
    <div className="flex items-center gap-x-8 ">
      {/* step one */}
      <div className="flex items-center flex-col gap-y-2 relative">
        <Circle variant={isActive(1) ? 'active' : 'inactive'} />
        <div
          className={cn(
            'h-px w-full absolute top-1/2 left-20 z-20 translate-x-0 -translate-y-4',
            isActive(1) ? 'bg-primary' : 'bg-default-500'
          )}
        />
        <Text variant={'bodySmall'}>Database Connection</Text>
      </div>
      {/* step two */}
      <div className="flex items-center flex-col gap-y-2 relative">
        <div
          className={cn(
            'h-px w-20 absolute top-1/2 left-0 z-10 translate-x-0 -translate-y-4',
            isActive(2) ? 'bg-primary' : 'bg-default-500'
          )}
        />
        <Circle variant={isActive(2) ? 'active' : 'inactive'} />
        <Text variant={'bodySmall'}>Table Discovery & Selection</Text>
        <div
          className={cn(
            'h-px w-full absolute top-1/2 left-14 z-20 translate-x-0 -translate-y-4',
            isActive(2) ? 'bg-primary' : 'bg-default-500'
          )}
        />
      </div>

      <div className="flex items-center flex-col gap-y-2 relative">
        <div
          className={cn(
            'h-px w-20 absolute top-1/2 left-0 z-10 translate-x-0 -translate-y-4',
            isActive(3) ? 'bg-primary' : 'bg-default-500'
          )}
        />
        <Circle variant={isActive(3) ? 'active' : 'inactive'} />
        <Text variant={'bodySmall'}>Metadata Capture</Text>
        <div
          className={cn(
            'h-px w-full absolute top-1/2 left-20 z-20 translate-x-0 -translate-y-4',
            isActive(3) ? 'bg-primary' : 'bg-default-500'
          )}
        />
      </div>

      <div className="flex items-center flex-col gap-y-2 relative">
        <div
          className={cn(
            'h-px w-20 absolute top-1/2 left-0 z-10 translate-x-0 -translate-y-4',
            isActive(4) ? 'bg-primary' : 'bg-default-500'
          )}
        />
        <Circle variant={isActive(4) ? 'active' : 'inactive'} />
        <Text variant={'bodySmall'}>Relationship Confirmation</Text>
      </div>
    </div>
  );
};

export default ProgressStep;
