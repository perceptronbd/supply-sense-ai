import { ReactNode, useId } from 'react';

const SectionWrapper = ({
  children,
  className,
  size = 'default',
  id,
}: {
  children: ReactNode;
  className?: string;
  size?: 'default' | 'medium' | 'large' | 'full';
  id?: string;
}) => {
  const generatedId = useId();
  const resolvedId = id ?? generatedId;

  return (
    <section
      id={resolvedId}
      className={`mx-auto py-16 ${
        size === 'default' && 'max-w-3xl px-4 lg:px-0'
      } ${size === 'medium' && 'px-8 max-w-6xl'} ${
        size === 'large' && 'container'
      } ${size === 'full' && 'md:px-20 2xl:px-40'} ${className}`}
    >
      {children}
    </section>
  );
};

export default SectionWrapper;
