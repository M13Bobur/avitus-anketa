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

export const updateApplicationStatusSchema = z.object({
  status: z.nativeEnum(ApplicationStatus),
  adminComment: z.string().optional(),
});

export const applicationFiltersSchema = z.object({
  search: z.string().optional(),
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
export type UpdateApplicationStatusDto = z.infer<typeof updateApplicationStatusSchema>;
export type ApplicationFiltersDto = z.infer<typeof applicationFiltersSchema>;
