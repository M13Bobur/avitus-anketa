import {
  ApplicationStatus,
  STEP_LABELS,
  SurveyAnswers,
  SurveyStep,
} from '@avitus/shared-types';

export interface ApplicationViewModel {
  _id: string;
  answers: SurveyAnswers;
  resumeFile?: string;
  photoFile?: string;
  status: ApplicationStatus;
  adminComment?: string;
  submittedAt?: string;
  createdAt: string;
  user?: {
    username?: string;
    firstName?: string;
    lastName?: string;
  };
}

const ANSWER_STEPS: SurveyStep[] = [
  'fullName', 'birthDate', 'gender', 'phone', 'address', 'position', 'otherPosition',
  'education', 'educationInstitution', 'specialty', 'pharmacyExperience', 'lastWorkplace',
  'lastPosition', 'dismissalReason', 'branch', 'computerSkills', 'fomExperience', 'fomPrograms',
  'workSchedule', 'businessTrips', 'expectedSalary', 'availableFrom', 'whyUs', 'strengths',
  'improvements', 'convicted', 'convictionNote', 'references',
];

const STATUS_EMOJI: Record<ApplicationStatus, string> = {
  [ApplicationStatus.NEW]: '🆕',
  [ApplicationStatus.REVIEWING]: '🔍',
  [ApplicationStatus.INTERVIEW]: '💬',
  [ApplicationStatus.ACCEPTED]: '✅',
  [ApplicationStatus.REJECTED]: '❌',
};

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatDate(iso?: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  return date.toLocaleDateString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatShortDate(iso?: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  return date.toLocaleDateString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatApplicationListItem(app: ApplicationViewModel): string {
  const name = app.answers.fullName ?? 'Noma\'lum';
  const position = app.answers.position ?? app.answers.otherPosition ?? '—';
  const emoji = STATUS_EMOJI[app.status] ?? '📄';
  const date = formatShortDate(app.submittedAt ?? app.createdAt);
  return `${emoji} ${name} · ${position} · ${date}`;
}

export function formatPhotoCaption(app: ApplicationViewModel): string {
  const name = app.answers.fullName ?? 'Noma\'lum';
  const position = app.answers.position ?? app.answers.otherPosition ?? '—';
  const emoji = STATUS_EMOJI[app.status] ?? '📄';
  return `${emoji} ${name}\n📋 ${position}\n📌 ${app.status}`;
}

export function formatApplicationDetail(app: ApplicationViewModel): string {
  const emoji = STATUS_EMOJI[app.status] ?? '📄';
  const lines: string[] = [
    `<b>📋 ARIZA</b>`,
    `<i>${escapeHtml(app._id.slice(-8).toUpperCase())}</i>`,
    '',
    `${emoji} <b>Holat:</b> ${escapeHtml(app.status)}`,
    `📅 <b>Yuborilgan:</b> ${formatDate(app.submittedAt ?? app.createdAt)}`,
  ];

  if (app.user) {
    const tgUser = app.user.username
      ? `@${escapeHtml(app.user.username)}`
      : escapeHtml([app.user.firstName, app.user.lastName].filter(Boolean).join(' ') || '—');
    lines.push(`💬 <b>Telegram:</b> ${tgUser}`);
  }

  lines.push('', `<b>━━━ SHAXSIY MA'LUMOTLAR ━━━</b>`);

  for (const step of ANSWER_STEPS) {
    const value = app.answers[step as keyof typeof app.answers];
    if (value === undefined || value === null || value === '') continue;
    if (step === 'otherPosition' && app.answers.position) continue;

    const label = STEP_LABELS[step];
    lines.push(`▫️ <b>${escapeHtml(label)}:</b> ${escapeHtml(String(value))}`);
  }

  if (app.resumeFile) {
    lines.push('', `📎 <b>Rezyume:</b> ${escapeHtml(app.resumeFile)}`);
  }
  if (app.photoFile) {
    lines.push(`🖼 <b>Foto:</b> ${escapeHtml(app.photoFile)}`);
  }
  if (app.adminComment) {
    lines.push('', `<b>━━━ ADMIN IZOHI ━━━</b>`);
    lines.push(`💬 ${escapeHtml(app.adminComment)}`);
  }

  return lines.join('\n');
}

export function splitMessage(text: string, maxLength = 4000): string[] {
  if (text.length <= maxLength) return [text];

  const chunks: string[] = [];
  let current = '';

  for (const line of text.split('\n')) {
    const next = current ? `${current}\n${line}` : line;
    if (next.length > maxLength) {
      if (current) chunks.push(current);
      current = line.length > maxLength ? line.slice(0, maxLength) : line;
    } else {
      current = next;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}
