import { ReactNode } from 'react';

const SectionWrapper = ({
  children,
  size = 'default',
}: {
  children: ReactNode;
  size?: 'default' | 'large' | 'full';
}) => {
  return (
    <section
      className={`mx-auto py-16 ${
        size === 'default' && 'max-w-3xl px-4 lg:px-0'
      } ${size === 'large' && 'px-8 max-w-6xl'} ${size === 'full' && 'md:px-20 2xl:px-40'}`}
    >
      {children}
    </section>
  );
};

export default SectionWrapper;
