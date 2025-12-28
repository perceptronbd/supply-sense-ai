import { Metadata } from 'next';
import NotFoundContent from '@/components/ui/NotFoundContent';

export const metadata: Metadata = {
  title: '404 – Page Not Found',
  description:
    'The page you are looking for could not be found. It may have been moved, deleted, or the URL is incorrect.',
};

export default function NotFound() {
  return <NotFoundContent />;
}
