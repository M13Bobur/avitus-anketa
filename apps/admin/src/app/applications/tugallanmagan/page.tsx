'use client';

import { ApplicationStatus } from '@avitus/shared-types';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ApplicationsList } from '@/components/applications/applications-list';

export default function IncompleteApplicationsPage() {
  return (
    <DashboardLayout>
      <ApplicationsList
        title="Tugallanmagan"
        description="Botda anketa boshlab, hali tugatmagan foydalanuvchilar"
        fixedStatus={ApplicationStatus.INCOMPLETE}
        showProgress
      />
    </DashboardLayout>
  );
}
