import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/utils';
import { Circle } from '.';

interface IStepClassNames {
  container?: string;
  connector?: string;
  circle?: string;
  text?: string;
  lastConnector?: string;
}
interface StepProps {
  label: string;
  step: number;
  currentStep: number;
  isLast: boolean;
  classNames?: IStepClassNames;
}

const Step = ({ label, step, currentStep, isLast, classNames }: StepProps) => {
  const isActive = step <= currentStep;
  const isComplete = step < currentStep;

  return (
    <div className={cn('flex items-center flex-col gap-y-2 relative', classNames?.container || '')}>
      {/* Left connector line - not shown for first step */}
      {step > 1 && (
        <div
          className={cn(
            'h-px w-20 absolute top-1/2 left-0 z-10 -translate-x-0.5 -translate-y-4',
            classNames?.connector || '',
            isComplete ? 'bg-primary' : 'bg-default-500'
          )}
        />
      )}

      <Circle variant={isActive ? 'active' : 'inactive'} isComplete={isComplete} />

      <Text variant="bodySmall">{label}</Text>

      {/* Right connector line - not shown for last step */}
      {!isLast && (
        <div
          className={cn(
            'h-px w-full absolute top-1/2 left-1/2 z-20 -translate-y-4',
            classNames?.connector || '',
            classNames?.lastConnector || '',
            isActive ? 'bg-primary' : 'bg-default-500'
          )}
        />
      )}
    </div>
  );
};

interface ProgressStepProps {
  /**
   * Array of step labels in order
   */
  steps: string[];
  /**
   * Current active step (1-based index)
   */
  currentStep: number;
  /**
   * Additional class name for the container
   */
  className?: string;
  /**
   * Additional class names for each step
   */
  stepClassNames?: IStepClassNames;
}

const ProgressStep = ({ steps, currentStep, className, stepClassNames }: ProgressStepProps) => {
  return (
    <div className={cn('flex items-center gap-x-8', className)}>
      {steps.map((label, index) => (
        <Step
          key={index}
          label={label}
          step={index + 1}
          currentStep={currentStep}
          isLast={index === steps.length - 1}
          classNames={stepClassNames}
        />
      ))}
    </div>
  );
};

export default ProgressStep;
