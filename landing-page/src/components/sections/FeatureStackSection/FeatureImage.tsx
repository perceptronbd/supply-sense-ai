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
      <div className="relative h-full w-full">
        {/* Outer glassmorphism */}
        <div
          className="relative h-full w-full overflow-hidden rounded-2xl p-6"
          style={{
            border: '1px solid rgba(242, 242, 242, 0.15)',
            boxShadow: `
          inset -4px -4px 48px 4px rgba(138, 138, 140, 0.08),
          inset 4px 4px 48px 4px rgba(138, 138, 140, 0.08)
        `,
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            background: 'rgba(0,0,0,0.15)',
          }}
        >
          {/* Inner container */}
          <div
            className="relative h-full w-full overflow-hidden rounded-2xl"
            style={{
              boxShadow: `
            2px 2px 4px 0px rgba(232, 74, 46, 0.5),
            -2px -2px 4px 0px rgba(226, 204, 156, 0.5)
          `,
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
          </div>
        </div>
      </div>
    </motion.div>
  );
};
