import { Image } from '@heroui/react';
import { type MotionValue, motion, useTransform } from 'framer-motion';
import type { Feature } from './types';
import { cn } from './utils';

interface FeatureImageProps {
  feature: Feature;
  index: number;
  total: number;
  scrollYProgress: MotionValue<number>;
}

export const FeatureImage = ({ feature, index, total, scrollYProgress }: FeatureImageProps) => {
  const stepSize = 1 / total;
  const start = index * stepSize;

  const opacity = useTransform(
    scrollYProgress,
    index === 0 ? [0, 1] : [start - 0.05, start],
    index === 0 ? [1, 1] : [0, 1]
  );

  return (
    <motion.div
      style={{ opacity, zIndex: index }}
      className="absolute inset-0 flex items-center justify-center overflow-hidden bg-zinc-900 will-change-opacity"
    >
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br opacity-10 mix-blend-color-dodge',
          feature.color
        )}
      />
      <Image
        src={feature.image}
        alt={feature.title}
        className="h-full w-full object-cover opacity-50"
        loading={index === 0 ? 'eager' : 'lazy'}
        removeWrapper
        disableSkeleton={index === 0}
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
        <div className="mb-6 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-zinc-300 backdrop-blur-md">
          Graphite Agent
        </div>
        <h3 className="text-3xl font-bold text-white drop-shadow-lg md:text-4xl lg:text-5xl max-w-lg leading-tight">
          {feature.title}
        </h3>
      </div>
    </motion.div>
  );
};
