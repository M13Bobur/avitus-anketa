'use client';

import { useQuery } from '@tanstack/react-query';
import { api, ApiResponse } from '@/lib/api';
import { DashboardStats } from '@avitus/shared-types';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Calendar, CheckCircle, Clock } from 'lucide-react';

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
      return data.data;
    },
  });

  const stats = [
    {
      title: 'Jami arizalar',
      value: data?.totalApplications ?? 0,
      icon: FileText,
      color: 'text-blue-600',
    },
    {
      title: 'Bugungi arizalar',
      value: data?.todayApplications ?? 0,
      icon: Calendar,
      color: 'text-green-600',
    },
    {
      title: 'Tugallangan',
      value: data?.completedApplications ?? 0,
      icon: CheckCircle,
      color: 'text-emerald-600',
    },
    {
      title: 'Tugallanmagan',
      value: data?.incompleteApplications ?? 0,
      icon: Clock,
      color: 'text-orange-600',
    },
  ];

  return (
    <DashboardLayout>
      <div>
        <h1 className="mb-8 text-3xl font-bold">Dashboard</h1>

        {isLoading ? (
          <p className="text-muted-foreground">Yuklanmoqda...</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
