import { Metadata } from 'next';
import { DatabaseConnections } from '@/components/pages/DatabaseConnections';

export const metadata: Metadata = {
  title: 'Database Connections',
  description: 'Manage and monitor your database connections.',
};

export default function page() {
  return <DatabaseConnections />;
}
