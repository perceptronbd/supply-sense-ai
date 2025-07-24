import { ReactNode } from 'react';

const SectionWrapper = ({
  children,
  className,
  size = 'default',
}: {
  children: ReactNode;
  className?: string;
  size?: 'default' | 'medium' | 'large' | 'full';
}) => {
  return (
    <section
      className={`mx-auto py-16 ${
        size === 'default' && 'max-w-3xl px-4 lg:px-0'
      } ${size === 'medium' && 'px-8 max-w-6xl'} ${
        size === 'large' && 'px-8 xl:w-[80%] md:w-[90%] w-[95%]'
      } ${size === 'full' && 'md:px-20 2xl:px-40'} ${className}`}
    >
      {children}
    </section>
  );
};

export default SectionWrapper;
