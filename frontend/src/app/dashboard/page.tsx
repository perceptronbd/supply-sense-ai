'use client';

import { QualityStatisticsChart } from '@/components/ai';
import { Text } from '@/components/ui/Text';
import type { RootState } from '@/store/store';
import { useSelector } from 'react-redux';

export default function DashboardPage() {
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <main className="p-6 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <Text variant="headerSmall" weight="bold" color="default" as="h1">
            Dashboard
          </Text>
          <Text variant="bodyBase" color="muted" className="mt-2" as="p">
            Welcome back, {user?.firstName} {user?.lastName}
          </Text>
        </header>

        {/* AI Quality Statistics Chart */}
        <section className="mb-8">
          <QualityStatisticsChart />
        </section>
      </div>
    </main>
  );
}
