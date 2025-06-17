import React, { useRef, useEffect, useState } from 'react';

interface ResponsiveTableWrapperProps {
  children: React.ReactNode;
}

/**
 * Enhanced table wrapper with scroll indicators and improved UX
 */
export const ResponsiveTableWrapper: React.FC<ResponsiveTableWrapperProps> = ({ children }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftShadow, setShowLeftShadow] = useState(false);
  const [showRightShadow, setShowRightShadow] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setShowLeftShadow(scrollLeft > 0);
        setShowRightShadow(scrollLeft < scrollWidth - clientWidth - 1);
      }
    };

    const scrollElement = scrollRef.current;
    if (scrollElement) {
      handleScroll(); // Initial check
      scrollElement.addEventListener('scroll', handleScroll);

      // Check on resize
      const resizeObserver = new ResizeObserver(handleScroll);
      resizeObserver.observe(scrollElement);

      return () => {
        scrollElement.removeEventListener('scroll', handleScroll);
        resizeObserver.disconnect();
      };
    }
  }, []);

  return (
    <div className="relative my-6">
      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-900"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgb(156 163 175) transparent',
        }}
      >
        {children}
      </div>

      {/* Left scroll shadow */}
      {showLeftShadow && (
        <div className="absolute top-0 left-0 w-8 h-full bg-gradient-to-r from-white dark:from-gray-900 to-transparent pointer-events-none z-10 rounded-l-lg" />
      )}

      {/* Right scroll shadow */}
      {showRightShadow && (
        <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-white dark:from-gray-900 to-transparent pointer-events-none z-10 rounded-r-lg" />
      )}

      {/* Mobile scroll hint */}
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center sm:hidden">
        ← Swipe horizontally to see more columns →
      </div>

      {/* Desktop scroll hint */}
      <div className="hidden sm:block text-xs text-gray-400 dark:text-gray-500 mt-1 text-right">
        {showLeftShadow || showRightShadow ? 'Scroll to see more columns' : 'All columns visible'}
      </div>
    </div>
  );
};

export default ResponsiveTableWrapper;
