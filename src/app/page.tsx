import { Suspense } from 'react';
import DashboardClient from '@/components/dashboard/DashboardClient';

export default function Home() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading dashboard...</div>}>
      <DashboardClient />
    </Suspense>
  );
}
