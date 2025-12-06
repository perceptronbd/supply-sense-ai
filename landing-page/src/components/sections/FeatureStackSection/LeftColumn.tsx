import type { MotionValue } from 'framer-motion';
import { FeatureImage } from './FeatureImage';
import type { Feature } from './types';

interface LeftColumnProps {
  features: Feature[];
  scrollYProgress: MotionValue<number>;
}

export const LeftColumn = ({ features, scrollYProgress }: LeftColumnProps) => {
  return (
    <div className="flex w-full max-w-xl flex-col justify-center">
      <div className="relative w-full">
        <div className="relative aspect-[4/3] w-full overflow-hidden ">
          {features.map((feature, index) => (
            <FeatureImage
              key={feature.id}
              feature={feature}
              index={index}
              total={features.length}
              scrollYProgress={scrollYProgress}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
