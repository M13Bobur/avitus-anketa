import { InlineKeyboardMarkup } from 'telegraf/types';

export const WELCOME_AUTH_MESSAGE =
  '🔐 <b>Avitus Admin Bot</b>\n\n' +
  'Arizalarni ko\'rish uchun admin panel parolini kiriting.\n\n' +
  '<i>Parol bir marta so\'raladi — keyin avtomatik tanlanasiz.</i>';

export const AUTH_SUCCESS_MESSAGE =
  '✅ <b>Muvaffaqiyatli kirildi!</b>\n\n' +
  'Quyidagi bo\'limlardan birini tanlang:';

export const AUTH_FAILED_MESSAGE =
  '❌ <b>Parol noto\'g\'ri</b>\n\n' +
  'Iltimos, admin panel parolini qayta kiriting.';

export const UNAUTHORIZED_MESSAGE =
  '🔒 Avval autentifikatsiyadan o\'ting.\n\n/start buyrug\'ini yuboring.';

export const EMPTY_LIST_MESSAGE = '📭 Bu bo\'limda arizalar topilmadi.';
export const LOADING_MESSAGE = '⏳ Yuklanmoqda...';

export function mainMenuKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: '🆕 Yangi arizalar', callback_data: 'ln:1' },
        { text: '📋 Barchasi', callback_data: 'la:1' },
      ],
    ],
  };
}

export function listHeader(filter: 'new' | 'all', total: number, page: number, totalPages: number): string {
  const title = filter === 'new' ? '🆕 Yangi arizalar' : '📋 Barcha arizalar';
  return (
    `<b>${title}</b>\n` +
    `<i>Jami: ${total} ta · Sahifa ${page}/${totalPages || 1}</i>\n\n` +
    'Ko\'rish uchun arizani tanlang 👇'
  );
}

function filterCode(filter: 'new' | 'all'): 'n' | 'a' {
  return filter === 'new' ? 'n' : 'a';
}

export function applicationListKeyboard(
  items: { id: string; label: string }[],
  filter: 'new' | 'all',
  page: number,
  totalPages: number,
): InlineKeyboardMarkup {
  const fc = filterCode(filter);
  const rows = items.map((item) => [
    { text: item.label.slice(0, 64), callback_data: `d:${item.id}:${fc}:${page}` },
  ]);

  const navRow: { text: string; callback_data: string }[] = [];
  if (page > 1) {
    navRow.push({ text: '◀️ Oldingi', callback_data: `l${fc}:${page - 1}` });
  }
  if (page < totalPages) {
    navRow.push({ text: 'Keyingi ▶️', callback_data: `l${fc}:${page + 1}` });
  }
  if (navRow.length) rows.push(navRow);

  rows.push([{ text: '🏠 Bosh menyu', callback_data: 'm' }]);

  return { inline_keyboard: rows };
}

export function applicationDetailKeyboard(
  filter: 'new' | 'all',
  page: number,
): InlineKeyboardMarkup {
  const fc = filterCode(filter);
  return {
    inline_keyboard: [
      [{ text: '◀️ Ro\'yxatga qaytish', callback_data: `l${fc}:${page}` }],
      [{ text: '🏠 Bosh menyu', callback_data: 'm' }],
    ],
  };
}

export function parseListCallback(data: string): { filter: 'new' | 'all'; page: number } | null {
  const match = data.match(/^l(n|a):(\d+)$/);
  if (!match) return null;
  return {
    filter: match[1] === 'n' ? 'new' : 'all',
    page: parseInt(match[2], 10) || 1,
  };
}

export function parseAppCallback(data: string): { appId: string; filter: 'new' | 'all'; page: number } | null {
  const match = data.match(/^d:([a-f0-9]{24}):(n|a):(\d+)$/);
  if (!match) return null;
  return {
    appId: match[1],
    filter: match[2] === 'n' ? 'new' : 'all',
    page: parseInt(match[3], 10) || 1,
  };
}
