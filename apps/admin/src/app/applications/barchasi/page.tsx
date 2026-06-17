'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ApplicationsList } from '@/components/applications/applications-list';

export default function AllApplicationsPage() {
  return (
    <DashboardLayout>
      <ApplicationsList
        title="Barchasi"
        description="Barcha statusdagi arizalar"
        showAll
      />
    </DashboardLayout>
  );
}
