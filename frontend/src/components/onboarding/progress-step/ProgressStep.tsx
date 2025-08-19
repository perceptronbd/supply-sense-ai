import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/utils';
import { Circle } from '.';
interface IProps {
  currentStep: number;
}

const ProgressStep = ({ currentStep }: IProps) => {
  const isActive = (step: number) => step < currentStep || step === currentStep;
  const isComplete = (step: number) => step < currentStep;
  const renderLine = (step: number) => isComplete(step) || isActive(step);
  return (
    <div className="flex items-center gap-x-8 max-lg:hidden">
      {/* step one */}
      <div className="flex items-center flex-col gap-y-2 relative">
        <Circle variant={isActive(1) ? 'active' : 'inactive'} isComplete={isComplete(1)} />
        <div
          className={cn(
            'h-px w-full absolute top-1/2 left-20 z-20 translate-x-0 -translate-y-4',
            renderLine(1) ? 'bg-primary' : 'bg-default-500'
          )}
        />
        <Text variant={'bodySmall'}>Database Connection</Text>
      </div>
      {/* step two */}
      <div className="flex items-center flex-col gap-y-2 relative">
        <div
          className={cn(
            'h-px w-20 absolute top-1/2 left-0 z-10 translate-x-0 -translate-y-4',
            renderLine(2) ? 'bg-primary' : 'bg-default-500'
          )}
        />
        <Circle variant={isActive(2) ? 'active' : 'inactive'} isComplete={isComplete(2)} />
        <Text variant={'bodySmall'}>Table Discovery & Selection</Text>
        <div
          className={cn(
            'h-px w-full absolute top-1/2 left-14 z-20 translate-x-0 -translate-y-4',
            renderLine(2) ? 'bg-primary' : 'bg-default-500'
          )}
        />
      </div>

      <div className="flex items-center flex-col gap-y-2 relative">
        <div
          className={cn(
            'h-px w-20 absolute top-1/2 left-0 z-10 translate-x-0 -translate-y-4',
            renderLine(3) ? 'bg-primary' : 'bg-default-500'
          )}
        />
        <Circle variant={isActive(3) ? 'active' : 'inactive'} isComplete={isComplete(3)} />
        <Text variant={'bodySmall'}>Metadata Capture</Text>
        <div
          className={cn(
            'h-px w-full absolute top-1/2 left-20 z-20 translate-x-0 -translate-y-4',
            renderLine(3) ? 'bg-primary' : 'bg-default-500'
          )}
        />
      </div>

      <div className="flex items-center flex-col gap-y-2 relative">
        <div
          className={cn(
            'h-px w-20 absolute top-1/2 left-0 z-10 translate-x-0 -translate-y-4',
            renderLine(4) ? 'bg-primary' : 'bg-default-500'
          )}
        />
        <Circle variant={isActive(4) ? 'active' : 'inactive'} isComplete={isComplete(4)} />
        <Text variant={'bodySmall'}>Relationship Confirmation</Text>
      </div>
    </div>
  );
};

export default ProgressStep;
