import { z } from 'zod';
import {
  Gender,
  Position,
  Education,
  PharmacyExperience,
  Branch,
  ComputerSkill,
  YesNo,
  WorkSchedule,
  Confirmation,
  ApplicationStatus,
  AdminRole,
} from '@avitus/shared-types';

export const loginSchema = z.object({
  username: z.string().min(1, 'Username required'),
  password: z.string().min(1, 'Password required'),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Joriy parolni kiriting'),
    newPassword: z
      .string()
      .min(8, 'Yangi parol kamida 8 ta belgidan iborat bo\'lishi kerak')
      .regex(/[A-Za-z]/, 'Parol kamida bitta harf bo\'lishi kerak')
      .regex(/[0-9]/, 'Parol kamida bitta raqam bo\'lishi kerak'),
    confirmPassword: z.string().min(1, 'Parolni tasdiqlang'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Yangi parollar mos kelmadi',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'Yangi parol joriy paroldan farqli bo\'lishi kerak',
    path: ['newPassword'],
  });

export const changeUsernameSchema = z.object({
  newUsername: z
    .string()
    .min(3, 'Login kamida 3 ta belgidan iborat bo\'lishi kerak')
    .max(50, 'Login 50 ta belgidan oshmasligi kerak')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Faqat harf, raqam, nuqta, tire va pastki chiziq'),
  currentPassword: z.string().min(1, 'Parolni kiriting'),
});

export const updateApplicationStatusSchema = z.object({
  status: z.nativeEnum(ApplicationStatus),
  adminComment: z.string().max(2000, 'Izoh 2000 belgidan oshmasligi kerak').optional(),
});

export const applicationFiltersSchema = z.object({
  search: z.string().max(100, 'Qidiruv 100 belgidan oshmasligi kerak').optional(),
  position: z.nativeEnum(Position).optional(),
  branch: z.nativeEnum(Branch).optional(),
  gender: z.nativeEnum(Gender).optional(),
  pharmacyExperience: z.nativeEnum(PharmacyExperience).optional(),
  status: z.nativeEnum(ApplicationStatus).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

const phoneRegex = /^(\+998|998)?[0-9]{9,12}$/;
const birthDateRegex = /^\d{1,2}[./-]\d{1,2}[./-]\d{4}$/;

const requiredText = (message: string, max: number) =>
  z
    .string({ required_error: message, invalid_type_error: message })
    .trim()
    .min(1, message)
    .max(max, `Maksimum ${max} ta belgi kiritish mumkin`);

export const surveyValidators: Record<string, z.ZodSchema> = {
  fullName: requiredText("Familiya, ism va otasining ismini kiriting", 200).min(
    5,
    "Familiya, ism va otasining ismi kamida 5 ta belgidan iborat bo'lishi kerak",
  ),
  birthDate: z
    .string({ required_error: "Tug'ilgan sanani kiriting" })
    .trim()
    .min(1, "Tug'ilgan sanani kiriting")
    .regex(birthDateRegex, "Sana formati noto'g'ri. Masalan: 01.01.1990"),
  gender: z.nativeEnum(Gender, { required_error: 'Jinsni tanlang' }),
  phone: z
    .string({ required_error: 'Telefon raqamini kiriting' })
    .trim()
    .min(1, 'Telefon raqamini kiriting')
    .transform((value) => value.replace(/[\s()-]/g, ''))
    .pipe(
      z.string().regex(phoneRegex, "Telefon raqam noto'g'ri formatda. Masalan: +998901234567"),
    ),
  address: requiredText('Doimiy yashash manzilini kiriting', 500).min(
    5,
    'Manzil kamida 5 ta belgidan iborat bo\'lishi kerak',
  ),
  position: z.nativeEnum(Position, { required_error: 'Lavozimni tanlang' }),
  otherPosition: requiredText('Lavozim nomini kiriting', 200).min(
    2,
    'Lavozim nomini kiriting',
  ),
  education: z.nativeEnum(Education, { required_error: "Ma'lumotni tanlang" }),
  educationInstitution: requiredText("Ta'lim muassasasi nomini kiriting", 300).min(
    2,
    "Ta'lim muassasasi nomini kiriting",
  ),
  specialty: requiredText('Mutaxassisligingizni kiriting', 200).min(
    2,
    'Mutaxassisligingizni kiriting',
  ),
  pharmacyExperience: z.nativeEnum(PharmacyExperience, {
    required_error: 'Farmatsevtika tajribasini tanlang',
  }),
  lastWorkplace: requiredText('Oxirgi ish joyingizni kiriting', 300).min(
    2,
    'Oxirgi ish joyingizni kiriting',
  ),
  lastPosition: requiredText('Oxirgi lavozimingizni kiriting', 200).min(
    2,
    'Oxirgi lavozimingizni kiriting',
  ),
  dismissalReason: requiredText('Ishdan bo\'shash sababini kiriting', 500).min(
    2,
    'Ishdan bo\'shash sababini kiriting',
  ),
  branch: z.nativeEnum(Branch, { required_error: 'Filialni tanlang' }),
  computerSkills: z.nativeEnum(ComputerSkill, {
    required_error: 'Kompyuter bilim darajasini tanlang',
  }),
  fomExperience: z.nativeEnum(YesNo, { required_error: 'Javobni tanlang' }),
  fomPrograms: requiredText('Dasturlar ro\'yxatini kiriting', 500).min(
    2,
    'Dasturlar ro\'yxatini kiriting',
  ),
  workSchedule: z.nativeEnum(WorkSchedule, { required_error: 'Ish grafigini tanlang' }),
  businessTrips: z.nativeEnum(YesNo, { required_error: 'Javobni tanlang' }),
  expectedSalary: requiredText('Kutilayotgan maoshni kiriting', 100),
  availableFrom: requiredText('Ish boshlash vaqtini kiriting', 100).min(
    2,
    'Ish boshlash vaqtini kiriting',
  ),
  whyUs: requiredText('Javobni kiriting', 2000).min(10, 'Kamida 10 ta belgi kiriting'),
  strengths: requiredText('Kuchli tomonlaringizni kiriting', 2000).min(
    10,
    'Kamida 10 ta belgi kiriting',
  ),
  improvements: requiredText('Javobni kiriting', 2000).min(10, 'Kamida 10 ta belgi kiriting'),
  convicted: z.nativeEnum(YesNo, { required_error: 'Javobni tanlang' }),
  convictionNote: requiredText('Sudlanganlik haqida izoh bering', 1000).min(
    5,
    'Sudlanganlik haqida izoh bering',
  ),
  references: z
    .string()
    .trim()
    .max(2000, 'Maksimum 2000 ta belgi kiritish mumkin')
    .min(10, '2 nafar shaxsning F.I.Sh. va telefon raqamini kiriting')
    .optional(),
  confirmation: z.nativeEnum(Confirmation, { required_error: 'Tasdiqlashni tanlang' }),
};

export type LoginDto = z.infer<typeof loginSchema>;
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
export type ChangeUsernameDto = z.infer<typeof changeUsernameSchema>;
export type UpdateApplicationStatusDto = z.infer<typeof updateApplicationStatusSchema>;
export type ApplicationFiltersDto = z.infer<typeof applicationFiltersSchema>;
