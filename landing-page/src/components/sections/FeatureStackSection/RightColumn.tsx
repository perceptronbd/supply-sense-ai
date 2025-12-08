import type { MotionValue } from 'framer-motion';
import { FeatureCard } from './FeatureCard';
import type { Feature } from './types';

interface RightColumnProps {
  features: Feature[];
  scrollYProgress: MotionValue<number>;
}

export const RightColumn = ({ features, scrollYProgress }: RightColumnProps) => {
  return (
    <div className="flex w-full max-w-xl flex-col justify-center">
      {features.map((feature, index) => (
        <FeatureCard
          key={feature.id}
          feature={feature}
          index={index}
          total={features.length}
          scrollYProgress={scrollYProgress}
        />
      ))}
    </div>
  );
};
