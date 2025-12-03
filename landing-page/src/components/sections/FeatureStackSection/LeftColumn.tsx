import type { MotionValue } from 'framer-motion';
import { FeatureImage } from './FeatureImage';
import type { Feature } from './types';

interface LeftColumnProps {
  features: Feature[];
  scrollYProgress: MotionValue<number>;
}

export const LeftColumn = ({ features, scrollYProgress }: LeftColumnProps) => {
  return (
    <div className="hidden w-full max-w-xl flex-col justify-center xl:flex">
      <div className="relative aspect-[4/3] w-full rounded-3xl border border-zinc-800 bg-zinc-950/50 p-1">
        {/* Corner Decorations */}
        <div className="absolute -left-[1px] -top-[1px] h-4 w-4 border-l border-t border-zinc-700" />
        <div className="absolute -right-[1px] -top-[1px] h-4 w-4 border-r border-t border-zinc-700" />
        <div className="absolute -bottom-[1px] -left-[1px] h-4 w-4 border-b border-l border-zinc-700" />
        <div className="absolute -bottom-[1px] -right-[1px] h-4 w-4 border-b border-r border-zinc-700" />

        {/* Plus Icons */}
        <div className="absolute left-4 top-4 text-zinc-800">+</div>
        <div className="absolute right-4 top-4 text-zinc-800">+</div>
        <div className="absolute bottom-4 left-4 text-zinc-800">+</div>
        <div className="absolute bottom-4 right-4 text-zinc-800">+</div>

        <div className="relative h-full w-full overflow-hidden rounded-2xl bg-zinc-900">
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
