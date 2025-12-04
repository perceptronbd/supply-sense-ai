import { Image } from '@heroui/react';
import { type MotionValue, motion, useTransform } from 'framer-motion';
import type { Feature } from './types';

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
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
    >
      {/* Outer glassmorphism container with padding */}
      <div className="relative h-full w-full">
        <div className="relative h-full w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          {/* Inner container with colored border/shadow around the image */}
          <div
            className="relative h-full w-full overflow-hidden rounded-2xl"
            style={{
              boxShadow:
                '2px 2px 4px 0px rgba(232, 74, 46, 0.5), -2px -2px 4px 0px rgba(226, 204, 156, 0.5)',
            }}
          >
            <Image
              src={feature.image}
              alt={feature.title}
              className="h-full w-full object-cover opacity-50"
              loading={index === 0 ? 'eager' : 'lazy'}
              removeWrapper
              disableSkeleton={index === 0}
            />

            {/* this is unnecessary */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
              <div className="mb-6 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-zinc-300 backdrop-blur-md">
                Graphite Agent
              </div>
              <h3 className="text-3xl font-bold text-white drop-shadow-lg md:text-4xl lg:text-5xl max-w-lg leading-tight">
                {feature.title}
              </h3>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
