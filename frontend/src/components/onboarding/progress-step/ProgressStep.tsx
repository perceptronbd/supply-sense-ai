import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/utils';
import { Circle } from '.';

interface IProps {
  currentStep: number;
}

const steps = [
  { label: 'Database Connection' },
  { label: 'Table Discovery & Selection' },
  { label: 'Metadata Capture' },
  { label: 'Relationship Confirmation' },
];

const ProgressStep = ({ currentStep }: IProps) => {
  const isActive = (step: number) => step === currentStep;
  const completeStep = (step: number) => step < currentStep;
  const renderLine = (step: number) => completeStep(step) || isActive(step);

  return (
    <div className="flex items-center gap-x-8">
      {steps.map((step, idx) => {
        const stepNum = idx + 1;
        return (
          <div key={step.label} className="flex items-center flex-col gap-y-2 relative">
            {/* Left line for all except first step */}
            {stepNum !== 1 && (
              <div
                className={cn(
                  'h-px w-20 absolute top-1/2 left-0 z-10 translate-x-0 -translate-y-4',
                  renderLine(stepNum) ? 'bg-primary' : 'bg-default-500'
                )}
              />
            )}
            <Circle
              variant={isActive(stepNum) ? 'active' : 'inactive'}
              isComplete={completeStep(stepNum)}
            />
            <Text variant="bodySmall">{step.label}</Text>
            {/* Right line for all except last step */}
            {stepNum !== steps.length && (
              <div
                className={cn(
                  `h-px w-full absolute top-1/2 left-${
                    stepNum === 2 ? '14' : '20'
                  } z-20 translate-x-0 -translate-y-4`,
                  renderLine(stepNum) ? 'bg-primary' : 'bg-default-500'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ProgressStep;
