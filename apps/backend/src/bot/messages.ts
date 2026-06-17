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
  SurveyStep,
} from '@avitus/shared-types';
import { Markup } from 'telegraf';

export const STEP_MESSAGES: Record<SurveyStep, string> = {
  fullName: '📝 *1/28* Familiyangiz, ismingiz va otangizning ismini kiriting:',
  birthDate: "📅 *2/28* Tug'ilgan sanangizni kiriting (masalan: 01.01.1990):",
  gender: '👤 *3/28* Jinsingizni tanlang:',
  phone: '📱 *4/28* Telefon raqamingizni kiriting (masalan: +998901234567):',
  address: '🏠 *5/28* Doimiy yashash manzilingizni kiriting:',
  position: '💼 *6/28* Qaysi lavozimga ishga kirishni istaysiz?',
  otherPosition: '💼 Boshqa lavozim nomini kiriting:',
  education: "🎓 *7/28* Ma'lumotingizni tanlang:",
  educationInstitution: "🏫 *8/28* Ta'lim muassasasi nomini kiriting:",
  specialty: '📚 *9/28* Mutaxassisligingizni kiriting:',
  pharmacyExperience: '💊 *10/28* Farmatsevtika sohasidagi ish tajribangiz:',
  lastWorkplace: '🏢 *11/28* Oxirgi ish joyingizni kiriting:',
  lastPosition: '👔 *12/28* Oxirgi ish joyidagi lavozimingizni kiriting:',
  dismissalReason: '📋 *13/28* Ishdan bo\'shash sababini kiriting:',
  branch: '🏪 *14/28* Qaysi filialda ishlamoqchisiz?',
  computerSkills: '💻 *15/28* Kompyuter dasturlaridan foydalanish darajangiz:',
  fomExperience: '🖥 *16/28* FOM yoki dorixona dasturlarida ishlaganmisiz?',
  fomPrograms: '🖥 Qaysi dasturlarda ishlagansiz? Ro\'yxatini kiriting:',
  workSchedule: '⏰ *17/28* Ish grafigiga munosabatingiz:',
  businessTrips: '✈️ *18/28* Xizmat safarlariga tayyormisiz?',
  expectedSalary: '💰 *19/28* Kutilayotgan oylik maoshingizni kiriting:',
  availableFrom: '📆 *20/28* Sizni ishga qachondan qabul qilish mumkin?',
  whyUs: '❓ *21/28* Nima uchun aynan bizning dorixonalar tarmog\'ida ishlashni xohlaysiz?',
  strengths: '💪 *22/28* O\'zingizning kuchli tomonlaringizni yozing:',
  improvements: '📈 *23/28* O\'zingiz ustida ishlashingiz kerak deb hisoblaydigan jihatlaringiz:',
  convicted: '⚖️ *24/28* Sudlanganmisiz?',
  convictionNote: '⚖️ Sudlanganlik haqida izoh bering:',
  references: '👥 *25/28* Tavsiya bera oladigan 2 nafar shaxsning F.I.Sh. va telefon raqami:',
  resume: '📎 *26/28* Rezyume yoki diplom sertifikatlarini yuklang (PDF, DOC, rasm):',
  photo: '📸 *27/28* Fotosuratingizni yuboring:',
  confirmation: '✅ *28/28* Barcha ma\'lumotlarni tekshiring va tasdiqlang:',
  completed: '🎉 Anketa muvaffaqiyatli topshirildi!',
};

function enumKeyboard(values: string[], columns = 2) {
  const buttons = values.map((v) => Markup.button.callback(v, `answer:${v}`));
  const rows: ReturnType<typeof Markup.button.callback>[][] = [];
  for (let i = 0; i < buttons.length; i += columns) {
    rows.push(buttons.slice(i, i + columns));
  }
  return Markup.inlineKeyboard(rows);
}

export function getStepKeyboard(step: SurveyStep) {
  switch (step) {
    case 'gender':
      return enumKeyboard(Object.values(Gender));
    case 'position':
      return enumKeyboard(Object.values(Position), 2);
    case 'education':
      return enumKeyboard(Object.values(Education), 2);
    case 'pharmacyExperience':
      return enumKeyboard(Object.values(PharmacyExperience), 1);
    case 'branch':
      return enumKeyboard(Object.values(Branch), 3);
    case 'computerSkills':
      return enumKeyboard(Object.values(ComputerSkill), 3);
    case 'fomExperience':
    case 'businessTrips':
    case 'convicted':
      return enumKeyboard(Object.values(YesNo), 2);
    case 'workSchedule':
      return enumKeyboard(Object.values(WorkSchedule), 1);
    case 'confirmation':
      return enumKeyboard(Object.values(Confirmation), 2);
    default:
      return undefined;
  }
}

export function isTextStep(step: SurveyStep): boolean {
  return [
    'fullName',
    'birthDate',
    'phone',
    'address',
    'otherPosition',
    'educationInstitution',
    'specialty',
    'lastWorkplace',
    'lastPosition',
    'dismissalReason',
    'fomPrograms',
    'expectedSalary',
    'availableFrom',
    'whyUs',
    'strengths',
    'improvements',
    'convictionNote',
    'references',
  ].includes(step);
}

export function isEnumStep(step: SurveyStep): boolean {
  return getStepKeyboard(step) !== undefined;
}

export function isFileStep(step: SurveyStep): boolean {
  return step === 'resume';
}

export function isPhotoStep(step: SurveyStep): boolean {
  return step === 'photo';
}

export const WELCOME_MESSAGE = `
🏥 *Avitus Dorixonalar Tarmog'i*
*Ishga qabul anketa tizimi*

Assalomu alaykum! 👋

Ushbu bot orqali ishga qabul anketa to'ldirishingiz mumkin.

*Buyruqlar:*
/start - Anketa boshlash
/status - Joriy holat
/restart - Anketani qayta boshlash
/cancel - Anketani bekor qilish

Anketa to'ldirish uchun /start buyrug'ini yuboring.
`.trim();

export const CANCEL_MESSAGE = '❌ Anketa bekor qilindi. Qayta boshlash uchun /start buyrug\'ini yuboring.';
export const RESTART_MESSAGE = '🔄 Anketa qayta boshlandi. Savollarga javob bering.';
export const COMPLETED_MESSAGE = `
🎉 *Tabriklaymiz!*

Anketingiz muvaffaqiyatli topshirildi.

HR bo'limi tez orada siz bilan bog'lanadi.

Rahmat! 🙏
`.trim();

export const REJECTED_MESSAGE = '❌ Anketa tasdiqlanmadi. Qayta boshlash uchun /start buyrug\'ini yuboring.';
