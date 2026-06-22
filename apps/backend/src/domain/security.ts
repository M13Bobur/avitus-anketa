import { config, isProduction } from '../config';

const WEAK_JWT_SECRETS = new Set([
  'dev-secret-change-me',
  'change-this-to-a-long-random-secret-key',
  'your-super-secret-jwt-key-change-in-production',
]);

const WEAK_ADMIN_PASSWORDS = new Set([
  'admin123',
  'password',
  '123456',
  'admin',
]);

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function validatePasswordStrength(password: string): void {
  if (password.length < 8) {
    throw new Error('Parol kamida 8 ta belgidan iborat bo\'lishi kerak');
  }
  if (!/[A-Za-z]/.test(password)) {
    throw new Error('Parol kamida bitta harf bo\'lishi kerak');
  }
  if (!/[0-9]/.test(password)) {
    throw new Error('Parol kamida bitta raqam bo\'lishi kerak');
  }
}

export function assertProductionSecurity(): void {
  if (!isProduction) return;

  if (WEAK_JWT_SECRETS.has(config.jwt.secret) || config.jwt.secret.length < 32) {
    throw new Error('Production: JWT_SECRET kamida 32 belgili kuchli kalit bo\'lishi kerak');
  }
}

export function assertSeedPasswordSafe(password: string): void {
  if (WEAK_ADMIN_PASSWORDS.has(password)) {
    throw new Error('Production: SEED_ADMIN_PASSWORD zaif — kuchli parol o\'rnating');
  }
  validatePasswordStrength(password);
}
