export enum UserStatus {
  NEW = 'new',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ApplicationStatus {
  INCOMPLETE = 'Tugallanmagan',
  NEW = 'Yangi',
  REVIEWING = "Ko'rib chiqilmoqda",
  INTERVIEW = 'Suhbat',
  ACCEPTED = 'Qabul qilindi',
  REJECTED = 'Rad etildi',
}

export const APPLICATIONS_ALL_SLUG = 'barchasi';

export const APPLICATION_STATUS_NAV = [
  { slug: 'tugallanmagan', status: ApplicationStatus.INCOMPLETE, label: 'Tugallanmagan' },
  { slug: 'yangi', status: ApplicationStatus.NEW, label: 'Yangi tushganlar' },
  { slug: 'korib-chiqilmoqda', status: ApplicationStatus.REVIEWING, label: "Ko'rib chiqilmoqda" },
  { slug: 'suhbat', status: ApplicationStatus.INTERVIEW, label: 'Suhbat' },
  { slug: 'qabul-qilindi', status: ApplicationStatus.ACCEPTED, label: 'Qabul qilindi' },
  { slug: 'rad-etildi', status: ApplicationStatus.REJECTED, label: 'Rad etildi' },
] as const;

export const APPLICATIONS_SIDEBAR = [
  { slug: APPLICATIONS_ALL_SLUG, label: 'Barchasi' },
  ...APPLICATION_STATUS_NAV,
] as const;

/** Eski inglizcha statuslardan migratsiya uchun */
export const LEGACY_APPLICATION_STATUS: Record<string, ApplicationStatus> = {
  New: ApplicationStatus.NEW,
  Reviewing: ApplicationStatus.REVIEWING,
  Interview: ApplicationStatus.INTERVIEW,
  Accepted: ApplicationStatus.ACCEPTED,
  Rejected: ApplicationStatus.REJECTED,
};

export function getStatusSlug(status: ApplicationStatus): string {
  return APPLICATION_STATUS_NAV.find((item) => item.status === status)?.slug ?? 'yangi';
}

export function getSurveyProgress(currentStep: SurveyStep): {
  current: number;
  total: number;
  label: string;
} {
  const visibleSteps = SURVEY_STEPS_ORDER.filter(
    (s) => !['otherPosition', 'fomPrograms', 'convictionNote', 'completed'].includes(s),
  );
  const index = visibleSteps.indexOf(currentStep);
  const current = index >= 0 ? index + 1 : visibleSteps.length;

  return {
    current,
    total: visibleSteps.length,
    label: STEP_LABELS[currentStep] ?? currentStep,
  };
}

export enum AdminRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  VIEWER = 'viewer',
}

export enum Gender {
  MALE = 'Erkak',
  FEMALE = 'Ayol',
}

export enum Position {
  PHARMACIST = 'Farmatsevt',
  SUPPLIER = "Ta'minotchi",
  SALES_REP = 'Savdo vakili',
  CASHIER = 'Kassir',
  CALL_CENTER = 'Call markaz operatori',
  OTHER = 'Boshqa',
}

export enum Education {
  SECONDARY = "O'rta",
  SECONDARY_SPECIAL = "O'rta maxsus",
  HIGHER = 'Oliy',
  INCOMPLETE_HIGHER = 'Tugallanmagan oliy',
}

export enum PharmacyExperience {
  NONE = "Tajribam yo'q",
  UP_TO_1 = '1 yilgacha',
  ONE_TO_3 = '1–3 yil',
  THREE_TO_5 = '3–5 yil',
  OVER_5 = '5 yildan ortiq',
}

export enum Branch {
  OKEAN = 'Okean',
  QVP = 'QVP',
  MAIN = 'Asosiy',
}

export enum ComputerSkill {
  GOOD = 'Yaxshi',
  AVERAGE = "O'rtacha",
  BEGINNER = 'Boshlang\'ich',
}

export enum YesNo {
  YES = 'Ha',
  NO = "Yo'q",
}

export enum WorkSchedule {
  FULL_SHIFT = 'To\'liq smenada ishlay olaman',
  EVENING_SHIFT = 'Kechki smenada ishlay olaman',
  WEEKENDS = 'Dam olish kunlari ham ishlay olaman',
  SPECIFIC_DAYS = 'Faqat ma\'lum kunlarda ishlay olaman',
}

export enum Confirmation {
  CONFIRM = 'Tasdiqlayman',
  REJECT = 'Tasdiqlamayman',
}

export type SurveyStep =
  | 'fullName'
  | 'birthDate'
  | 'gender'
  | 'phone'
  | 'address'
  | 'position'
  | 'otherPosition'
  | 'education'
  | 'educationInstitution'
  | 'specialty'
  | 'pharmacyExperience'
  | 'lastWorkplace'
  | 'lastPosition'
  | 'dismissalReason'
  | 'branch'
  | 'computerSkills'
  | 'fomExperience'
  | 'fomPrograms'
  | 'workSchedule'
  | 'businessTrips'
  | 'expectedSalary'
  | 'availableFrom'
  | 'whyUs'
  | 'strengths'
  | 'improvements'
  | 'convicted'
  | 'convictionNote'
  | 'references'
  | 'resume'
  | 'photo'
  | 'confirmation'
  | 'completed';

export interface SurveyAnswers {
  fullName?: string;
  birthDate?: string;
  gender?: Gender;
  phone?: string;
  address?: string;
  position?: Position;
  otherPosition?: string;
  education?: Education;
  educationInstitution?: string;
  specialty?: string;
  pharmacyExperience?: PharmacyExperience;
  lastWorkplace?: string;
  lastPosition?: string;
  dismissalReason?: string;
  branch?: Branch;
  computerSkills?: ComputerSkill;
  fomExperience?: YesNo;
  fomPrograms?: string;
  workSchedule?: WorkSchedule;
  businessTrips?: YesNo;
  expectedSalary?: string;
  availableFrom?: string;
  whyUs?: string;
  strengths?: string;
  improvements?: string;
  convicted?: YesNo;
  convictionNote?: string;
  references?: string;
}

export interface IUser {
  _id: string;
  telegramId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  currentStep: SurveyStep;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface IApplication {
  _id: string;
  userId: string;
  answers: SurveyAnswers;
  resumeFile?: string;
  photoFile?: string;
  completed: boolean;
  status: ApplicationStatus;
  adminComment?: string;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: IUser;
}

export interface IAdmin {
  _id: string;
  username: string;
  role: AdminRole;
  telegramId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalApplications: number;
  todayApplications: number;
  completedApplications: number;
  incompleteApplications: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApplicationFilters {
  search?: string;
  position?: Position;
  branch?: Branch;
  gender?: Gender;
  pharmacyExperience?: PharmacyExperience;
  status?: ApplicationStatus;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  admin: Omit<IAdmin, 'createdAt' | 'updatedAt'> & { createdAt?: string; updatedAt?: string };
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangeUsernameRequest {
  newUsername: string;
  currentPassword: string;
}

export interface UpdateApplicationStatusRequest {
  status: ApplicationStatus;
  adminComment?: string;
}

export const SURVEY_STEPS_ORDER: SurveyStep[] = [
  'fullName',
  'birthDate',
  'gender',
  'phone',
  'address',
  'position',
  'otherPosition',
  'education',
  'educationInstitution',
  'specialty',
  'pharmacyExperience',
  'lastWorkplace',
  'lastPosition',
  'dismissalReason',
  'branch',
  'computerSkills',
  'fomExperience',
  'fomPrograms',
  'workSchedule',
  'businessTrips',
  'expectedSalary',
  'availableFrom',
  'whyUs',
  'strengths',
  'improvements',
  'convicted',
  'convictionNote',
  'references',
  'resume',
  'photo',
  'confirmation',
  'completed',
];

export const STEP_LABELS: Record<SurveyStep, string> = {
  fullName: 'Familiya, ism va otasining ismi',
  birthDate: "Tug'ilgan sana",
  gender: 'Jins',
  phone: 'Telefon raqami',
  address: 'Doimiy yashash manzili',
  position: 'Lavozim',
  otherPosition: 'Boshqa lavozim',
  education: "Ma'lumot",
  educationInstitution: "Ta'lim muassasasi",
  specialty: 'Mutaxassislik',
  pharmacyExperience: 'Farmatsevtika tajribasi',
  lastWorkplace: 'Oxirgi ish joyi',
  lastPosition: 'Oxirgi lavozim',
  dismissalReason: 'Ishdan bo\'shash sababi',
  branch: 'Filial',
  computerSkills: 'Kompyuter bilimi',
  fomExperience: 'FOM/dorixona dasturlari',
  fomPrograms: 'Dasturlar ro\'yxati',
  workSchedule: 'Ish grafigi',
  businessTrips: 'Xizmat safarlariga rozilik',
  expectedSalary: 'Kutilayotgan maosh',
  availableFrom: 'Ish boshlash vaqti',
  whyUs: 'Nima uchun bizda ishlash',
  strengths: 'Kuchli tomonlar',
  improvements: 'Rivojlantirish kerak bo\'lgan jihatlar',
  convicted: 'Sudlanganlik',
  convictionNote: 'Sudlanganlik izohi',
  references: 'Tavsiyalar',
  resume: 'Rezyume',
  photo: 'Fotosurat',
  confirmation: 'Tasdiqlash',
  completed: 'Tugallangan',
};
