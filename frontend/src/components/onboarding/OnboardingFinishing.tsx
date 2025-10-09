import { useEffect } from 'react';
import BlinkingLogo from '../ui/animations/BlinkingLogo';
import { Text } from '../ui/Text';

const OnboardingFinishing = () => {
  useEffect(() => {
    // Simulate a network request
    const timer = setTimeout(() => {
      window.location.href = '/chat';
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="grid place-content-center h-full">
      <BlinkingLogo size={100} />
      <Text variant="headerSmall" color="primary" weight={'bold'} className="mt-5 xl:mt-12 ">
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
