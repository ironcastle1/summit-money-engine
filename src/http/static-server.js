import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { brotliCompress, gzip } from 'node:zlib';
import { promisify } from 'node:util';
import path from 'node:path';
import { NotFoundError } from '../core/errors.js';

const compressBrotli = promisify(brotliCompress);
const compressGzip = promisify(gzip);
const COMPRESSIBLE = new Set(['.html', '.js', '.css', '.json', '.svg', '.txt', '.webmanifest']);
const MIME = Object.freeze({
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
});

function safePath(root, requestPath) {
  const relative = requestPath === '/' ? 'index.html' : requestPath.replace(/^\/+/, '');
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(root, relative);
  if (!resolved.startsWith(`${resolvedRoot}${path.sep}`) && resolved !== resolvedRoot) throw new NotFoundError();
  return resolved;
}

function acceptsEncoding(request, encoding) {
  return String(request.headers['accept-encoding'] || '').toLowerCase().split(',').some(item => item.trim().split(';')[0] === encoding);
}

function cacheControl(extension, production, requestPath) {
  if (extension === '.html') return 'no-store, max-age=0, must-revalidate';
  if (!production || requestPath === '/sw.js' || requestPath.endsWith('.webmanifest')) return 'no-cache';
  const fingerprinted = /[.-][a-f0-9]{8,}[.-]/i.test(requestPath);
  return fingerprinted ? 'public, max-age=31536000, immutable' : 'public, max-age=3600, stale-while-revalidate=86400';
}

function weakEtag(info, body) {
  const hash = createHash('sha1').update(body).digest('base64url').slice(0, 16);
  return `W/"${info.size.toString(16)}-${Math.floor(info.mtimeMs).toString(16)}-${hash}"`;
}

export function createStaticHandler(options) {
  const root = options.root;
  const production = Boolean(options.production);
  const compressionThreshold = options.compressionThreshold || 1024;
  const cache = new Map();

  async function fileRecord(filePath, info) {
    const key = `${filePath}:${info.mtimeMs}:${info.size}`;
    if (cache.has(key)) return cache.get(key);
    const body = await readFile(filePath);
    const record = { body, etag: weakEtag(info, body), gzip: null, br: null };
    cache.set(key, record);
    if (cache.size > 200) cache.delete(cache.keys().next().value);
    return record;
  }

  return async function serveStatic({ request, response, context }) {
    let filePath = safePath(root, context.path);
    let info;
    try {
      info = await stat(filePath);
      if (info.isDirectory()) {
        filePath = path.join(filePath, 'index.html');
        info = await stat(filePath);
      }
    } catch {
      if (!context.path.includes('.')) {
        filePath = path.join(root, 'index.html');
        info = await stat(filePath);
      } else throw new NotFoundError('File not found', { path: context.path });
    }
    if (!info.isFile()) throw new NotFoundError('File not found', { path: context.path });

    const extension = path.extname(filePath).toLowerCase();
    const record = await fileRecord(filePath, info);
    response.setHeader('content-type', MIME[extension] || 'application/octet-stream');
    response.setHeader('cache-control', cacheControl(extension, production, context.path));
    response.setHeader('etag', record.etag);
    response.setHeader('last-modified', info.mtime.toUTCString());
    response.setHeader('vary', 'accept-encoding');

    if (request.headers['if-none-match'] === record.etag) {
      response.statusCode = 304;
      response.end();
      return;
    }

    let body = record.body;
    if (body.length >= compressionThreshold && COMPRESSIBLE.has(extension)) {
      if (acceptsEncoding(request, 'br')) {
        record.br ||= await compressBrotli(body, { params: { 1: 5 } });
        body = record.br;
        response.setHeader('content-encoding', 'br');
      } else if (acceptsEncoding(request, 'gzip')) {
        record.gzip ||= await compressGzip(body, { level: 6 });
        body = record.gzip;
        response.setHeader('content-encoding', 'gzip');
      }
    }

    response.statusCode = 200;
    response.setHeader('content-length', body.length);
    if (context.method === 'HEAD') response.end();
    else response.end(body);
  };
}
