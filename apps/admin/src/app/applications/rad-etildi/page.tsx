'use client';

import { ApplicationStatus } from '@avitus/shared-types';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ApplicationsList } from '@/components/applications/applications-list';

export default function RejectedApplicationsPage() {
  return (
    <DashboardLayout>
      <ApplicationsList
        title="Rad etildi"
        description="Rad etilgan arizalar"
        fixedStatus={ApplicationStatus.REJECTED}
      />
    </DashboardLayout>
  );
}
