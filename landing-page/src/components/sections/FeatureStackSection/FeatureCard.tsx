import { type MotionValue, motion, useMotionValueEvent, useTransform } from 'framer-motion';
import { useState } from 'react';
import useGradientIcons from '../../icons/useGradientIcons';
import type { Feature } from './types';

interface FeatureCardProps {
  feature: Feature;
  index: number;
  total: number;
  scrollYProgress: MotionValue<number>;
}

export const FeatureCard = ({ feature, index, total, scrollYProgress }: FeatureCardProps) => {
  const stepSize = 1 / total;
  const start = index * stepSize;
  const end = (index + 1) * stepSize;

  const progress = useTransform(scrollYProgress, [start, end], [0, 1]);
  const isLast = index === total - 1;
  const isFirst = index === 0;

  const [isOpen, setIsOpen] = useState(isFirst);

  useMotionValueEvent(progress, 'change', (latest) => {
    if (isFirst) {
      setIsOpen(latest < 0.9);
    } else if (isLast) {
      setIsOpen(latest > 0.1);
    } else {
      setIsOpen(latest > 0.1 && latest < 0.9);
    }
  });

  const { CheckCircle, Message, Search, Document } = useGradientIcons();

  const Icon =
    feature.icon === 'CheckCircle'
      ? CheckCircle
      : feature.icon === 'Message'
        ? Message
        : feature.icon === 'Search'
          ? Search
          : Document;

  // Active State Logic
  const opacityRange = isFirst ? [0, 0.9, 1] : isLast ? [0, 0.1] : [0, 0.1, 0.9, 1];
  const opacityValues = isFirst ? [1, 1, 0.5] : isLast ? [0.5, 1] : [0.5, 1, 1, 0.5];
  const activeOpacity = useTransform(progress, opacityRange, opacityValues);

  const barHeight = useTransform(progress, [0, 1], ['0%', '100%']);

  return (
    <div className="relative">
      <div className="relative overflow-hidden pl-0">
        <div className="flex gap-4 items-start h-full mb-3 relative">
          {/* Progress Bar (Left Border) */}
          <div className="absolute left-0 top-0 h-full w-1 bg-zinc-800/50 rounded-full overflow-hidden">
            <motion.div
              style={{ height: barHeight }}
              className="w-full bg-gradient-to-b from-primary-200 via-primary to-primary-200"
            />
          </div>

          <div className="pl-6 w-full">
            <div className="flex gap-3 items-center mb-2">
              <Icon className="h-8 w-8 shrink-0" />
              <motion.h3
                className="bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent text-xl font-medium font-brand"
                style={{ opacity: activeOpacity }}
              >
                {feature.title}
              </motion.h3>
            </div>

            <div className="overflow-hidden">
              <motion.div
                initial={false}
                animate={{
                  height: isOpen ? 'auto' : 0,
                  opacity: isOpen ? 1 : 0,
                  marginTop: isOpen ? 12 : 0,
                }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                <p className="text-content4-foreground text-start mb-3 text-sm">
                  {feature.subtitle}
                </p>
                <p className="text-content4-foreground text-start mb-3 max-w-md italic">
                  {feature.quote}
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
