import fs from 'node:fs';
import path from 'node:path';

export function ensureDirectories() {
  const dirs = [
    path.resolve('./data'),
    path.resolve(process.env.MERLIN_UPLOAD_DIR || './data/uploads'),
    path.resolve(process.env.MERLIN_PREVIEW_DIR || './data/previews'),
    path.resolve(process.env.MERLIN_PRODUCT_DIR || './data/products')
  ];
  for (const dir of dirs) fs.mkdirSync(dir, { recursive: true });
}

export function safeFilename(name) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^_+|_+$/g, '') || 'file';
}
