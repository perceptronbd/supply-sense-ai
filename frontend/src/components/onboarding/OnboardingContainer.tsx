'use client';

import { useOnboardingStore } from '@/store/hooks/useOnboardingStore';
import {
  DbConnection,
  MetadataCapture,
  ProgressStep,
  RelationshipConfirmation,
  TableDiscoverySelection,
} from '.';

const OnboardingContainer = () => {
  const { currentStep = 1 } = useOnboardingStore();
  return (
    <section className="h-screen flex flex-col py-12 w-full container gap-y-7">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 flex-grow">
        {/* step one - database connection */}
        {currentStep === 1 && <DbConnection />}
        {/* step two - table discovery selection */}
        {currentStep === 2 && <TableDiscoverySelection />}
        {/* step three - metadata capture */}
        {currentStep === 3 && <MetadataCapture />}
        {/* step four - relationship confirmation */}
        {currentStep === 4 && <RelationshipConfirmation />}
      </div>
      {/* progress step */}
      <ProgressStep currentStep={currentStep} />
    </section>
  );
};

export default OnboardingContainer;
