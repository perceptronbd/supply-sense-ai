'use client';

import { useScroll, useSpring } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { features } from './data';
import { LeftColumn } from './LeftColumn';
import { RightColumn } from './RightColumn';

const SECTION_ID = 'features';

export const FeatureStackSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollContainer, setScrollContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const container = document.getElementById('/');
    if (container) {
      setScrollContainer(container);
    }
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    container: scrollContainer ? { current: scrollContainer } : undefined,
    offset: ['start start', 'end end'],
  });

  // Add spring smoothing to the scroll progress
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 50,
    damping: 20,
    restDelta: 0.001,
  });

  return (
    <section
      ref={containerRef}
      id={SECTION_ID}
      className="relative h-[750vh] snap-start container mx-auto"
    >
      {/* Internal Snap Points for smooth scrolling with snap-mandatory */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: <>
          key={i}
          className="absolute w-full h-screen snap-start pointer-events-none"
          style={{ top: `${i * 100}vh` }}
        />
      ))}
      <div className="sticky top-0 min-h-screen lg:h-screen w-full overflow-hidden">
        <div className="flex min-h-full flex-col lg:flex-row items-center px-2 xl:px-0 justify-center gap-6 lg:gap-20 mt-16 lg:mt-0">
          {/* Left Column: Image/Animation */}
          <LeftColumn features={features} scrollYProgress={smoothProgress} />

          {/* Right Column: Feature Cards */}
          <RightColumn features={features} scrollYProgress={smoothProgress} />
        </div>
      </div>
    </section>
  );
};
