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
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <div className="flex h-full flex-col xl:flex-row items-center justify-center gap-10 xl:gap-20">
          {/* Left Column: Image/Animation */}
          <LeftColumn features={features} scrollYProgress={smoothProgress} />

          {/* Right Column: Feature Cards */}
          <RightColumn features={features} scrollYProgress={smoothProgress} />
        </div>
      </div>
    </section>
  );
};
