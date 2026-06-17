'use client';

import { ApplicationStatus } from '@avitus/shared-types';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ApplicationsList } from '@/components/applications/applications-list';

export default function AcceptedApplicationsPage() {
  return (
    <DashboardLayout>
      <ApplicationsList
        title="Qabul qilindi"
        description="Ishga qabul qilingan nomzodlar"
        fixedStatus={ApplicationStatus.ACCEPTED}
      />
    </DashboardLayout>
  );
}
