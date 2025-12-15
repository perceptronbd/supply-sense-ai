import { MobileFeatureItem } from './MobileFeatureItem';
import type { Feature } from './types';

interface MobileFeaturesListProps {
  features: Feature[];
}

export const MobileFeaturesList = ({ features }: MobileFeaturesListProps) => {
  return (
    <div className="flex lg:hidden flex-col w-full h-full px-4 py-16">
      <div className="flex flex-col w-full max-w-2xl mx-auto">
        {features.map((feature) => (
          <MobileFeatureItem key={feature.id} feature={feature} />
        ))}
      </div>
    </div>
  );
};
