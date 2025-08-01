import DrawingLogo from '../ui/DrawingLogo';
import { Text } from '../ui/Text';

const OnboardingFinishing = () => {
  return (
    <div className="grid place-content-center h-full">
      <DrawingLogo size={100} variant={'primary'} speed="fast" showFill={true} />
      <Text variant="headerSmall" color="primary" weight={'bold'} className="mt-[8%] xl:mt-12 ">
        SupplySense
        <Text as={'span'} variant={'headerSmall'} weight={'bold'} color="default" className="ml-2">
          is working...
        </Text>
      </Text>
      <Text variant={'bodyBase'} color="default" className="text-default-500 text-center">
        Preparing Chat Agent for your Outsource Dev...
      </Text>
    </div>
  );
};

export default OnboardingFinishing;
