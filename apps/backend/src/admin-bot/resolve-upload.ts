import fs from 'fs';
import path from 'path';
import { config } from '../config';

const LEGACY_UPLOAD_DIRS = [
  path.resolve(process.cwd(), 'apps/backend/uploads'),
  path.resolve(process.cwd(), 'apps/backend/apps/backend/uploads'),
];

export function resolveUploadFile(filename: string): string | null {
  const candidates = [
    path.join(config.upload.dir, filename),
    ...LEGACY_UPLOAD_DIRS.map((dir) => path.join(dir, filename)),
  ];

  for (const filePath of candidates) {
    if (fs.existsSync(filePath)) return filePath;
  }

  return null;
}
