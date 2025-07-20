'use client';
import { useState } from 'react';
import DbConnection from './db-connection/DbConnection';
import { ProgressStep } from './progress-step';
import TableDiscoverySelection from './table-discovery-selection/TableDiscoverySelection';

const OnboardingContainer = () => {
  const [currentStep] = useState(2);
  return (
    <section className="h-screen flex flex-col py-12 w-full container gap-y-7">
      {/* step one - database connection */}
      {currentStep === 1 && <DbConnection />}
      {/* step two - table discovery selection */}
      {currentStep === 2 && <TableDiscoverySelection />}
      {/* progress step */}
      <ProgressStep currentStep={currentStep} />
    </section>
  );
};

export default OnboardingContainer;
