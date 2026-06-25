'use client';

import { ApplicationStatus, IApplication, STEP_LABELS, SurveyStep } from '@avitus/shared-types';
import { formatDate } from '@/lib/utils';

const PRINT_STEPS: SurveyStep[] = [
  'fullName', 'birthDate', 'gender', 'phone', 'address',
  'position', 'otherPosition', 'branch',
  'education', 'educationInstitution', 'specialty',
  'pharmacyExperience', 'lastWorkplace', 'lastPosition', 'dismissalReason',
  'computerSkills', 'fomExperience', 'fomPrograms',
  'workSchedule', 'businessTrips', 'expectedSalary', 'availableFrom',
  'whyUs', 'strengths', 'improvements', 'convicted', 'convictionNote', 'references',
];

const STATUS_CLASS: Record<ApplicationStatus, string> = {
  [ApplicationStatus.INCOMPLETE]: 'print-status print-status-reviewing',
  [ApplicationStatus.NEW]: 'print-status',
  [ApplicationStatus.REVIEWING]: 'print-status print-status-reviewing',
  [ApplicationStatus.INTERVIEW]: 'print-status print-status-interview',
  [ApplicationStatus.ACCEPTED]: 'print-status print-status-accepted',
  [ApplicationStatus.REJECTED]: 'print-status print-status-rejected',
};

interface ApplicationPrintViewProps {
  application: IApplication;
  status: ApplicationStatus;
  photoSrc: string | null;
}

export function ApplicationPrintView({
  application,
  status,
  photoSrc,
}: ApplicationPrintViewProps) {
  const fullName = application.answers.fullName ?? 'Nomzod';
  const shortId = application._id.slice(-6).toUpperCase();
  const submitted = application.submittedAt ? formatDate(application.submittedAt) : '—';

  const fields = PRINT_STEPS.map((step) => {
    const value = application.answers[step as keyof typeof application.answers];
    if (!value) return null;
    return { step, value: String(value) };
  }).filter(Boolean) as { step: SurveyStep; value: string }[];

  return (
    <div className="print-sheet">
      <div className="print-top">
        <div className="print-header-main">
          <div className="print-header-row">
            <span className="print-id">Ariza #{shortId}</span>
            <span className={STATUS_CLASS[status]}>{status}</span>
          </div>
          <p className="print-date">Topshirilgan: {submitted}</p>
        </div>
        {photoSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoSrc} alt={fullName} className="print-photo" />
        )}
      </div>

      <dl className="print-grid">
        {fields.map(({ step, value }) => (
          <div key={step} className="print-field">
            <dt className="print-label">{STEP_LABELS[step]}</dt>
            <dd className="print-value">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
