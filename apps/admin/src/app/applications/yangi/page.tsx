'use client';

import { ApplicationStatus } from '@avitus/shared-types';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ApplicationsList } from '@/components/applications/applications-list';

export default function YangiApplicationsPage() {
  return (
    <DashboardLayout>
      <ApplicationsList
        title="Yangi tushganlar"
        description="Yangi kelib tushgan va hali ko'rib chiqilmagan arizalar"
        fixedStatus={ApplicationStatus.NEW}
      />
    </DashboardLayout>
  );
}
