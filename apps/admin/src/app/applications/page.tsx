'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function ApplicationsIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/applications/barchasi/');
  }, [router]);

  return (
    <DashboardLayout>
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Yo'naltirilmoqda...</p>
      </div>
    </DashboardLayout>
  );
}
