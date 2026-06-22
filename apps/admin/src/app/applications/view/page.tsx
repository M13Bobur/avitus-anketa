'use client';

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { api, ApiResponse } from '@/lib/api';
import { ApplicationStatus, getStatusSlug, IApplication, STEP_LABELS, SurveyStep, AdminRole } from '@avitus/shared-types';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ApplicationPrintView } from '@/components/applications/application-print-view';
import { printApplicationSheet } from '@/lib/print-page';
import { useAuth } from '@/context/auth-context';
import { hasMinRole } from '@/lib/admin-role';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { statusColors, normalizeApplicationStatus } from '@/lib/status';
import { ArrowLeft, Download, Printer } from 'lucide-react';

const ANSWER_STEPS: SurveyStep[] = [
  'fullName', 'birthDate', 'gender', 'phone', 'address', 'position', 'otherPosition',
  'education', 'educationInstitution', 'specialty', 'pharmacyExperience', 'lastWorkplace',
  'lastPosition', 'dismissalReason', 'branch', 'computerSkills', 'fomExperience', 'fomPrograms',
  'workSchedule', 'businessTrips', 'expectedSalary', 'availableFrom', 'whyUs', 'strengths',
  'improvements', 'convicted', 'convictionNote', 'references',
];

function useAuthenticatedFileUrl(url: string | null) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setSrc(null);
      return;
    }

    let objectUrl: string | null = null;
    const token = localStorage.getItem('token');

    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.blob() : Promise.reject()))
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => setSrc(null));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  return src;
}

function ApplicationDetailContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id') ?? '';
  const queryClient = useQueryClient();
  const { admin } = useAuth();
  const canEditStatus = admin ? hasMinRole(admin.role, AdminRole.ADMIN) : false;

  const [status, setStatus] = useState<ApplicationStatus>(ApplicationStatus.NEW);
  const [comment, setComment] = useState('');

  const { data: application, isLoading } = useQuery({
    queryKey: ['application', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<IApplication>>(`/applications/${id}`);
      setStatus(normalizeApplicationStatus(data.data.status));
      setComment(data.data.adminComment ?? '');
      return data.data;
    },
    enabled: !!id,
  });

  const photoUrl = application?.photoFile
    ? `${process.env.NEXT_PUBLIC_API_URL || '/api'}/files/${application.photoFile}`
    : null;
  const photoSrc = useAuthenticatedFileUrl(photoUrl);

  const updateMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/applications/${id}/status`, {
        status,
        adminComment: comment,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application', id] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });

  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useCallback(() => {
    const sheet = printRef.current?.querySelector('.print-sheet');
    if (!sheet) return;

    const runPrint = () => printApplicationSheet(sheet as HTMLElement);

    if (photoSrc) {
      const img = new Image();
      img.onload = runPrint;
      img.onerror = runPrint;
      img.src = photoSrc;
      return;
    }

    runPrint();
  }, [photoSrc]);

  if (!id) {
    return <p className="text-destructive">Ariza ID topilmadi</p>;
  }

  if (isLoading) {
    return <p className="text-muted-foreground">Yuklanmoqda...</p>;
  }

  if (!application) {
    return <p className="text-destructive">Ariza topilmadi</p>;
  }

  const normalizedStatus = normalizeApplicationStatus(application.status);
  const backHref = `/applications/${getStatusSlug(normalizedStatus)}/`;

  return (
    <>
      <div className="print-only" ref={printRef}>
        <ApplicationPrintView
          application={application}
          status={normalizedStatus}
          photoSrc={photoSrc}
        />
      </div>

      <div className="no-print">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={backHref}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Orqaga
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Ariza #{application._id.slice(-6)}</h1>
            <Badge variant={statusColors[normalizedStatus]}>{normalizedStatus}</Badge>
          </div>
          <div className="flex gap-2">
            {application.resumeFile && (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const response = await api.get(`/files/${application.resumeFile}`, {
                    responseType: 'blob',
                  });
                  const url = window.URL.createObjectURL(response.data);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = application.resumeFile!;
                  a.click();
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Rezyume
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Chop etish
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Javoblar</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Topshirilgan: {formatDate(application.submittedAt)}
                </p>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-4 sm:grid-cols-2">
                  {ANSWER_STEPS.map((step) => {
                    const value = application.answers[step as keyof typeof application.answers];
                    if (!value) return null;
                    return (
                      <div key={step} className="border-b pb-3">
                        <dt className="text-sm font-medium text-muted-foreground">
                          {STEP_LABELS[step]}
                        </dt>
                        <dd className="mt-1 whitespace-pre-wrap text-sm">{String(value)}</dd>
                      </div>
                    );
                  })}
                </dl>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {photoSrc && (
              <Card>
                <CardHeader>
                  <CardTitle>Fotosurat</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoSrc}
                    alt="Nomzod fotosurati"
                    className="w-full rounded-md object-cover"
                  />
                </CardContent>
              </Card>
            )}

            {canEditStatus && (
              <Card>
                <CardHeader>
                  <CardTitle>Holat boshqaruvi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
                  >
                    {Object.values(ApplicationStatus).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>

                  <textarea
                    className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Izoh qo'shing..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    maxLength={2000}
                  />

                  <Button
                    className="w-full"
                    onClick={() => updateMutation.mutate()}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function ApplicationViewPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<p className="text-muted-foreground">Yuklanmoqda...</p>}>
        <ApplicationDetailContent />
      </Suspense>
    </DashboardLayout>
  );
}
