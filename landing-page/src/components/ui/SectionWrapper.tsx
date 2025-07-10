import { ReactNode } from 'react';

const SectionWrapper = ({ children }: { children: ReactNode }) => {
  return <section className="max-w-3xl mx-auto px-4 lg:px-0 py-16">{children}</section>;
};

export default SectionWrapper;
