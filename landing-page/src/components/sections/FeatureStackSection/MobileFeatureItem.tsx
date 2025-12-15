import { Image } from '@heroui/react';
import { motion } from 'framer-motion';
import NextImage from 'next/image';
import useGradientIcons from '../../icons/useGradientIcons';
import type { Feature } from './types';

interface MobileFeatureItemProps {
  feature: Feature;
}

export const MobileFeatureItem = ({ feature }: MobileFeatureItemProps) => {
  const { CheckCircle, Message, Search, Document } = useGradientIcons();

  const Icon =
    feature.icon === 'CheckCircle'
      ? CheckCircle
      : feature.icon === 'Message'
        ? Message
        : feature.icon === 'Search'
          ? Search
          : Document;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col gap-6 py-8 snap-start"
    >
      {/* Text Content */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
        className="flex flex-col gap-3"
      >
        <div className="flex gap-3 items-center">
          <Icon className="h-8 w-8 shrink-0" />
          <h3 className="bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent text-xl font-medium font-brand">
            {feature.title}
          </h3>
        </div>
        <div className="pl-11">
          <p className="text-content4-foreground text-start mb-3 text-sm">{feature.subtitle}</p>
          <p className="text-content4-foreground text-base text-start mb-3 italic">
            {feature.quote}
          </p>
        </div>
      </motion.div>

      {/* Image */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.2 }}
        className="relative w-full aspect-[4/3] sm:aspect-video rounded-2xl overflow-hidden"
      >
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none z-10"
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
        <Image
          src={feature.image}
          alt={feature.title}
          as={NextImage}
          fill
          sizes="(max-width: 768px) 100vw, 80vw"
          className="p-6 object-contain bg-default-50/50"
          removeWrapper
        />
      </motion.div>
    </motion.div>
  );
};
