'use client';
import { useState } from 'react';
import DbConnection from './db-connection/DbConnection';
import { ProgressStep } from './progress-step';

const OnboardingContainer = () => {
  const [currentStep] = useState(1);
  return (
    <section className="h-screen flex flex-col py-12 w-full container gap-y-7">
      {/* step one - database connection */}
      <DbConnection />
      {/* progress step */}
      <ProgressStep currentStep={currentStep} />
    </section>
  );
};

export default OnboardingContainer;
