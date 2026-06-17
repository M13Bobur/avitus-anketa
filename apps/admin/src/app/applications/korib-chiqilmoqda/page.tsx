'use client';

import { ApplicationStatus } from '@avitus/shared-types';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ApplicationsList } from '@/components/applications/applications-list';

export default function ReviewingApplicationsPage() {
  return (
    <DashboardLayout>
      <ApplicationsList
        title="Ko'rib chiqilmoqda"
        description="HR tomonidan ko'rib chiqilayotgan arizalar"
        fixedStatus={ApplicationStatus.REVIEWING}
      />
    </DashboardLayout>
  );
}
