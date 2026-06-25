import { ValidationError } from './errors/app.error';

export type DetectedFileType = 'pdf' | 'doc' | 'docx' | 'jpeg' | 'png' | 'webp' | 'unknown';

const RESUME_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const PHOTO_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const EXT_BY_TYPE: Record<Exclude<DetectedFileType, 'unknown'>, string> = {
  pdf: '.pdf',
  doc: '.doc',
  docx: '.docx',
  jpeg: '.jpg',
  png: '.png',
  webp: '.webp',
};

function startsWithBytes(buffer: Buffer, bytes: number[]): boolean {
  if (buffer.length < bytes.length) return false;
  return bytes.every((b, i) => buffer[i] === b);
}

export function detectFileType(buffer: Buffer): DetectedFileType {
  if (buffer.length >= 4 && buffer.toString('ascii', 0, 4) === '%PDF') {
    return 'pdf';
  }

  if (startsWithBytes(buffer, [0xff, 0xd8, 0xff])) {
    return 'jpeg';
  }

  if (startsWithBytes(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return 'png';
  }

  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'webp';
  }

  if (startsWithBytes(buffer, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) {
    return 'doc';
  }

  if (
    buffer.length >= 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07) &&
    (buffer[3] === 0x04 || buffer[3] === 0x06 || buffer[3] === 0x08)
  ) {
    const sample = buffer.subarray(0, Math.min(buffer.length, 8000)).toString('binary');
    if (sample.includes('word/')) {
      return 'docx';
    }
  }

  return 'unknown';
}

export function extensionForType(type: DetectedFileType): string {
  if (type === 'unknown') {
    throw new ValidationError('Fayl turi aniqlanmadi');
  }
  return EXT_BY_TYPE[type];
}

export function validateResumeContent(
  buffer: Buffer,
  mimeType?: string,
): 'pdf' | 'doc' | 'docx' {
  const detected = detectFileType(buffer);

  if (!['pdf', 'doc', 'docx'].includes(detected)) {
    throw new ValidationError('Rezyume faqat PDF yoki Word (DOC/DOCX) formatida bo\'lishi kerak');
  }

  if (mimeType && mimeType !== 'application/octet-stream') {
    if (PHOTO_MIME_TYPES.has(mimeType)) {
      throw new ValidationError('Rezyume faqat PDF yoki Word (DOC/DOCX) formatida bo\'lishi kerak');
    }

    const mimeAllowed =
      RESUME_MIME_TYPES.has(mimeType) ||
      (detected === 'docx' && mimeType === 'application/zip');

    if (!mimeAllowed) {
      throw new ValidationError('Rezyume faqat PDF yoki Word (DOC/DOCX) formatida bo\'lishi kerak');
    }
  }

  return detected as 'pdf' | 'doc' | 'docx';
}

export function validatePhotoContent(
  buffer: Buffer,
  mimeType?: string,
): 'jpeg' | 'png' | 'webp' {
  const detected = detectFileType(buffer);

  if (!['jpeg', 'png', 'webp'].includes(detected)) {
    throw new ValidationError('Faqat rasm formatida fayl yuboring (JPG, PNG yoki WEBP)');
  }

  if (mimeType && mimeType !== 'application/octet-stream') {
    if (RESUME_MIME_TYPES.has(mimeType) || mimeType === 'application/pdf') {
      throw new ValidationError('Faqat rasm formatida fayl yuboring (JPG, PNG yoki WEBP)');
    }

    if (!PHOTO_MIME_TYPES.has(mimeType)) {
      throw new ValidationError('Faqat rasm formatida fayl yuboring (JPG, PNG yoki WEBP)');
    }
  }

  return detected as 'jpeg' | 'png' | 'webp';
}
