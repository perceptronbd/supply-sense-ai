import { Image } from '@heroui/react';
import { type MotionValue, motion, useMotionValueEvent } from 'framer-motion';
import NextImage from 'next/image';
import { useState } from 'react';
import type { Feature } from './types';

interface FeatureImageProps {
  feature: Feature;
  index: number;
  total: number;
  scrollYProgress: MotionValue<number>;
}

export const FeatureImage = ({ feature, index, total, scrollYProgress }: FeatureImageProps) => {
  const [isActive, setIsActive] = useState(index === 0);

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    const activeIndex = Math.min(Math.floor(latest * total), total - 1);
    setIsActive(index === activeIndex);
  });

  return (
    <motion.div
      animate={{ opacity: isActive ? 1 : 0 }}
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      className="absolute inset-0"
      style={{ zIndex: index }}
    >
      <div className="relative h-full w-full rounded-2xl">
        {/* glass morphism */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
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
        />

        {/* image */}
        <Image
          src={feature.image}
          alt={feature.title}
          as={NextImage}
          fill
          sizes="(max-width: 1280px) 100vw, 50vw"
          className="p-6 object-contain"
          priority={index === 0}
          removeWrapper
          disableSkeleton={index === 0}
        />
      </div>
    </motion.div>
  );
};
