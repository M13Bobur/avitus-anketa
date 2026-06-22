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

export const surveyValidators: Record<string, z.ZodSchema> = {
  fullName: z
    .string()
    .min(5, "Familiya, ism va otasining ismi kamida 5 ta belgidan iborat bo'lishi kerak")
    .max(200),
  birthDate: z
    .string()
    .min(4, "Tug'ilgan sanani kiriting (masalan: 01.01.1990)")
    .max(20),
  gender: z.nativeEnum(Gender),
  phone: z
    .string()
    .regex(phoneRegex, "Telefon raqam noto'g'ri formatda. Masalan: +998901234567"),
  address: z.string().min(5, 'Manzil kamida 5 ta belgidan iborat bo\'lishi kerak').max(500),
  position: z.nativeEnum(Position),
  otherPosition: z.string().min(2, 'Lavozim nomini kiriting').max(200),
  education: z.nativeEnum(Education),
  educationInstitution: z.string().min(2).max(300),
  specialty: z.string().min(2).max(200),
  pharmacyExperience: z.nativeEnum(PharmacyExperience),
  lastWorkplace: z.string().min(2).max(300),
  lastPosition: z.string().min(2).max(200),
  dismissalReason: z.string().min(2).max(500),
  branch: z.nativeEnum(Branch),
  computerSkills: z.nativeEnum(ComputerSkill),
  fomExperience: z.nativeEnum(YesNo),
  fomPrograms: z.string().min(2, 'Dasturlar ro\'yxatini kiriting').max(500),
  workSchedule: z.nativeEnum(WorkSchedule),
  businessTrips: z.nativeEnum(YesNo),
  expectedSalary: z.string().min(1).max(100),
  availableFrom: z.string().min(2).max(100),
  whyUs: z.string().min(10, 'Kamida 10 ta belgi kiriting').max(2000),
  strengths: z.string().min(10).max(2000),
  improvements: z.string().min(10).max(2000),
  convicted: z.nativeEnum(YesNo),
  convictionNote: z.string().min(5).max(1000),
  references: z.string().min(10, '2 nafar shaxsning F.I.Sh. va telefon raqamini kiriting').max(2000),
  confirmation: z.nativeEnum(Confirmation),
};

export type LoginDto = z.infer<typeof loginSchema>;
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
export type ChangeUsernameDto = z.infer<typeof changeUsernameSchema>;
export type UpdateApplicationStatusDto = z.infer<typeof updateApplicationStatusSchema>;
export type ApplicationFiltersDto = z.infer<typeof applicationFiltersSchema>;
