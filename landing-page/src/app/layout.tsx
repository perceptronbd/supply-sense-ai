import './global.css';

export const metadata = {
  title: 'Welcome to Supply Sense AI',
  description: 'Supply Sense AI - Your AI-Powered Supply Chain Solution',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
