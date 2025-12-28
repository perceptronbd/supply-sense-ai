import Provider from '../providers/Provider';
import './global.css';
import { Montserrat } from 'next/font/google';
import localFont from 'next/font/local';
import ClarityInit from '../providers/Clarity-init';

const clashDisplay = localFont({
  src: './../../public/fonts/ClashDisplay-Variable.ttf',
  variable: '--font-clash-display',
  weight: '100 200 400 500 700',
  display: 'swap',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
  weight: ['100', '200', '300', '400', '500', '600', '700'],
});

export const metadata = {
  title: 'Welcome to Supply Sense AI',
  description: 'Supply Sense AI - Your AI-Powered Supply Chain Solution',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${clashDisplay.variable} ${montserrat.variable} font-primary`}
        suppressHydrationWarning
      >
        <ClarityInit />
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
