import type { PropsWithChildren } from 'react';

const WithoutSidebar = ({ children }: PropsWithChildren) => {
  return <div className="min-h-screen bg-background">{children}</div>;
};

export default WithoutSidebar;
