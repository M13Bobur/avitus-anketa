'use client';

import { ApplicationStatus } from '@avitus/shared-types';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ApplicationsList } from '@/components/applications/applications-list';

export default function InterviewApplicationsPage() {
  return (
    <DashboardLayout>
      <ApplicationsList
        title="Suhbat"
        description="Suhbat bosqichidagi nomzodlar"
        fixedStatus={ApplicationStatus.INTERVIEW}
      />
    </DashboardLayout>
  );
}
