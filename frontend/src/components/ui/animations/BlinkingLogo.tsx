'use client';
import { motion, Transition, useMotionValue, useSpring } from 'framer-motion';
import { useEffect, useRef } from 'react';

interface BlinkingLogoProps {
  floating?: boolean;
  animated?: boolean;
  color?: 'black' | 'blue-gray';
  size?: number;
}

export default function BlinkingLogo({
  floating = true,
  animated = true,
  color = 'blue-gray',
  size = 204,
}: BlinkingLogoProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Smooth mouse tracking with spring physics
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150 };
  const eyeX = useSpring(mouseX, springConfig);
  const eyeY = useSpring(mouseY, springConfig);

  useEffect(() => {
    if (!animated) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Calculate angle and distance for eye movement
        const deltaX = e.clientX - centerX;
        const deltaY = e.clientY - centerY;

        // Limit eye movement range
        const maxDistance = 6;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const limitedDistance = Math.min(distance / 50, maxDistance);

        const angle = Math.atan2(deltaY, deltaX);
        mouseX.set(Math.cos(angle) * limitedDistance);
        mouseY.set(Math.sin(angle) * limitedDistance);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY, animated]);

  // Blinking animation - more frequent
  const blinkAnimation = animated
    ? {
        scaleY: [1, 1, 0.1, 1, 1, 1, 0.1, 1],
        opacity: [1, 1, 0.7, 1, 1, 1, 0.7, 1],
      }
    : {};

  const blinkTransition: Transition = animated
    ? {
        duration: 3,
        times: [0, 0.3, 0.32, 0.34, 0.6, 0.7, 0.72, 0.74],
        repeat: Number.POSITIVE_INFINITY,
        ease: 'easeInOut',
      }
    : {};

  // Floating animation - conditional based on prop
  const floatingAnimation =
    floating && animated
      ? {
          y: [0, -15, 0],
          rotate: [-2, 2, -2],
        }
      : {};

  const floatingTransition: Transition =
    floating && animated
      ? {
          y: {
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            ease: 'easeInOut',
          },
          rotate: {
            duration: 3,
            repeat: Number.POSITIVE_INFINITY,
            ease: 'easeInOut',
          },
        }
      : {};

  const colorMap = {
    black: '#000000',
    'blue-gray': '#26262A',
  };

  const fillColor = colorMap[color];

  // Calculate height maintaining aspect ratio (169/204)
  const height = (size * 169) / 204;

  return (
    <motion.div
      ref={containerRef}
      style={{ display: 'inline-block' }}
      animate={floatingAnimation}
      transition={floatingTransition}
    >
      <motion.svg
        width={size}
        height={height}
        viewBox="0 0 204 169"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        whileHover={
          animated
            ? {
                scale: 1.05,
                transition: {
                  type: 'spring',
                  bounce: 0.6,
                  duration: 0.6,
                },
              }
            : undefined
        }
      >
        {/* Head Background */}
        <rect width="204" height="169" rx="70" fill="#E84A2E" />

        {/* Face Shape */}
        <path
          d="M78.374 18C85.1826 18 90.7021 23.5195 90.7021 30.3281V33.0537C90.7019 38.8418 85.9653 43.5105 80.1777 43.4277L77.3818 43.3877C73.132 43.3269 69.6543 46.7556 69.6543 51.0059C69.6541 55.2132 66.2434 58.6238 62.0361 58.624H47.8545C35.8149 58.6241 26.0547 68.3842 26.0547 80.4238V100.625C26.0548 123.821 44.8594 142.626 68.0557 142.626H135.682C158.878 142.626 177.682 123.821 177.682 100.625V80.4238C177.682 68.3842 167.921 58.624 155.882 58.624H141.701C137.494 58.624 134.083 55.2133 134.083 51.0059C134.083 46.7558 130.605 43.3271 126.355 43.3877L123.559 43.4277C117.771 43.5105 113.034 38.8418 113.034 33.0537V30.3281C113.034 23.5196 118.554 18.0002 125.362 18H129.135C133.86 18 137.69 21.8305 137.69 26.5557C137.69 31.2968 141.546 35.1346 146.287 35.1123L169.714 35.002C187.375 34.919 201.736 49.2134 201.736 66.875V101.081C201.736 137.487 171.61 167 135.204 167H68.5332C32.1272 167 2.00002 137.487 2 101.081V66.875C2 49.2134 16.362 34.9189 34.0234 35.002L57.4492 35.1123C62.1903 35.1346 66.0459 31.2968 66.0459 26.5557C66.0462 21.8305 69.8773 18 74.6025 18H78.374Z"
          fill={fillColor}
        />

        {/* Left Eye - Animated with blinking and following */}
        <motion.g style={animated ? { x: eyeX, y: eyeY } : {}}>
          <motion.path
            d="M66 73C69.866 73 73 74.7624 73 76.9365V100.063C73 102.238 69.866 104 66 104C62.134 104 59 102.238 59 100.063V76.9365C59 74.7624 62.134 73 66 73Z"
            fill={fillColor}
            animate={blinkAnimation}
            transition={blinkTransition}
            style={{ originY: '50%', originX: '50%' }}
          />
        </motion.g>

        {/* Right Eye - Animated with blinking and following */}
        <motion.g style={animated ? { x: eyeX, y: eyeY } : {}}>
          <motion.path
            d="M138 73C141.866 73 145 74.7625 145 76.9365V100.063C145 102.238 141.866 104 138 104C134.134 104 131 102.238 131 100.063V76.9365C131 74.7625 134.134 73 138 73Z"
            fill={fillColor}
            animate={blinkAnimation}
            transition={
              animated
                ? {
                    duration: 3,
                    times: [0, 0.3, 0.32, 0.34, 0.6, 0.7, 0.72, 0.74],
                    repeat: Number.POSITIVE_INFINITY,
                    ease: 'easeInOut',
                    delay: 0.05,
                  }
                : {}
            }
            style={{ originY: '50%', originX: '50%' }}
          />
        </motion.g>
      </motion.svg>
    </motion.div>
  );
}
