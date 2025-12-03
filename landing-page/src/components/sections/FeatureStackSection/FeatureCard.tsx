import { type MotionValue, motion, useTransform } from 'framer-motion';
import type { Feature } from './types';
import { cn } from './utils';

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

  // Active State Logic
  const activeOpacity = useTransform(
    progress,
    isFirst ? [0, 0.9, 1] : isLast ? [0, 0.1] : [0, 0.1, 0.9, 1],
    isFirst ? [1, 1, 0.5] : isLast ? [0.5, 1] : [0.5, 1, 1, 0.5]
  );

  const borderColor = useTransform(
    progress,
    isFirst ? [0, 0.9, 1] : isLast ? [0, 0.1] : [0, 0.1, 0.9, 1],
    isFirst
      ? ['rgba(82, 82, 91, 1)', 'rgba(82, 82, 91, 1)', 'rgba(39, 39, 42, 1)']
      : isLast
        ? ['rgba(39, 39, 42, 1)', 'rgba(82, 82, 91, 1)']
        : [
            'rgba(39, 39, 42, 1)',
            'rgba(82, 82, 91, 1)',
            'rgba(82, 82, 91, 1)',
            'rgba(39, 39, 42, 1)',
          ]
  );

  const backgroundColor = useTransform(
    progress,
    isFirst ? [0, 0.9, 1] : isLast ? [0, 0.1] : [0, 0.1, 0.9, 1],
    isFirst
      ? ['rgba(24, 24, 27, 0.5)', 'rgba(24, 24, 27, 0.5)', 'rgba(24, 24, 27, 0)']
      : isLast
        ? ['rgba(24, 24, 27, 0)', 'rgba(24, 24, 27, 0.5)']
        : [
            'rgba(24, 24, 27, 0)',
            'rgba(24, 24, 27, 0.5)',
            'rgba(24, 24, 27, 0.5)',
            'rgba(24, 24, 27, 0)',
          ]
  );

  const contentHeight = useTransform(
    progress,
    isFirst ? [0, 0.9, 1] : isLast ? [0, 0.1] : [0, 0.1, 0.9, 1],
    isFirst ? [120, 120, 0] : isLast ? [0, 120] : [0, 120, 120, 0]
  );

  const contentOpacity = useTransform(
    progress,
    isFirst ? [0, 0.9, 1] : isLast ? [0, 0.1] : [0, 0.1, 0.9, 1],
    isFirst ? [1, 1, 0] : isLast ? [0, 1] : [0, 1, 1, 0]
  );

  const barHeight = useTransform(progress, [0, 1], ['0%', '100%']);

  return (
    <div className="relative">
      <motion.div
        className="relative overflow-hidden rounded-xl border p-6"
        style={{
          borderColor: borderColor,
          backgroundColor: backgroundColor,
        }}
      >
        {/* Progress Bar (Left Border) */}
        <div className="absolute left-0 top-0 h-full w-1 bg-zinc-800/50">
          <motion.div style={{ height: barHeight }} className={cn('w-full bg-white')} />
        </div>

        <div className="pl-4">
          <motion.h3
            className="text-lg font-semibold text-white"
            style={{ opacity: activeOpacity }}
          >
            {feature.title}
          </motion.h3>

          <div className="overflow-hidden">
            <motion.div
              style={{
                height: contentHeight,
                opacity: contentOpacity,
                marginTop: useTransform(
                  progress,
                  isFirst ? [0, 1] : [0, 0.05],
                  isFirst ? [12, 12] : [0, 12]
                ),
              }}
            >
              <p className="text-zinc-400 mb-4 text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
