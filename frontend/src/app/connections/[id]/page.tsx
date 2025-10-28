'use client';

import { useRouter } from 'next/navigation';
import { use } from 'react';
import UpdateBusinessContext from '@/components/connections/update-business-context/UpdateBusinessContext';
import { ProgressStep } from '@/components/onboarding';
import { useGetCompanyId } from '@/hooks/useGetCompanyId';
import { Icons } from '@/lib/icons/Icons';
import { useOnboardingStore } from '@/store/hooks/useOnboardingStore';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function Page({ params }: Readonly<PageProps>) {
  const { id: dbConnectionId } = use(params);
  const { companyId } = useGetCompanyId();
  const router = useRouter();
  const { updateCurrentStep, setUpdateCurrentStep } = useOnboardingStore();

  const handleOnBack = () => {
    if (updateCurrentStep === 1) {
      router.back();
    } else {
      setUpdateCurrentStep(updateCurrentStep - 1);
    }
  };

  return (
    <main className="h-full flex flex-col bg-background">
      <div className="h-full flex flex-col flex-1 bg-content2 rounded-xl overflow-y-auto">
        {/* Back button */}
        <div className="p-6">
          <button
            type="button"
            onClick={handleOnBack}
            className="flex items-center text-primary hover:text-secondary transition-colors"
          >
            <Icons.ChevronLeft className="w-5 h-5" />
            Back
          </button>
        </div>

        {/* Main Content */}
        <div className="px-6">
          {updateCurrentStep === 1 && (
            <UpdateBusinessContext companyId={companyId} dbConnectionId={dbConnectionId} />
          )}

          {/* Footer Progress Indicator */}
          <div className=" max-lg:mt-16  lg:fixed bottom-10">
            <ProgressStep
              currentStep={updateCurrentStep}
              steps={['Business Context', 'Tables Selection', 'Tables Relations']}
              stepClassNames={{
                connector: 'first:w-16',
              }}
              className="justify-center"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
