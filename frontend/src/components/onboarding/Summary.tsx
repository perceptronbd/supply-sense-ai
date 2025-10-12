import { Text } from '@/components/ui/Text';
import { useOnboardingStore } from '@/store/hooks/useOnboardingStore';
import { LogoWithName } from '../ui/LogoWithName';

interface IProps {
  header: string;
  headerHighlight: string;
  description?: string;
  as?: 'span' | 'p';
  subDescription?: string;
}

const Summary = ({
  header,
  headerHighlight,
  description,
  subDescription = 'We don’t train on your data.',
  as = 'span',
}: IProps) => {
  const { currentStep } = useOnboardingStore();
  return (
    <div className="lg:mt-[13%] max-lg:mb-10">
      <div className="flex items-center justify-between">
        <LogoWithName />
        <span className="font-semibold text-xl lg:hidden">{currentStep} of 4</span>
      </div>
      <Text variant="headerMedium" color="secondary" weight={'bold'} className="mt-5 xl:mt-12 ">
        {header}
        <Text as={as} variant={'headerMedium'} weight={'bold'} color="primary" className="ml-2">
          {headerHighlight}
        </Text>
      </Text>
      <Text variant={'bodyMedium'} weight={'medium'} className="mt-4">
        {description}
      </Text>
      <Text style={{ fontStyle: 'italic' }} color="secondary" className="mt-2">
        {subDescription}
      </Text>
    </div>
  );
};

export default Summary;
