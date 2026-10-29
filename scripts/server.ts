import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http';
import { lstat, readFile, realpath, stat } from 'node:fs/promises';
import { resolve, relative, extname, isAbsolute, sep } from 'node:path';
import { readDirectoryPath, resourceUrl } from '../src/lib/catalog.ts';
const mime: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.webm': 'video/webm',
  '.pdf': 'application/pdf',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
};
async function send(file: string, req: IncomingMessage, res: ServerResponse) {
  const data = await readFile(file);
  res.setHeader(
    'Content-Type',
    mime[extname(file).toLowerCase()] || 'application/octet-stream',
  );
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (new URL(req.url || '/', 'http://localhost').searchParams.has('download'))
    res.setHeader('Content-Disposition', 'attachment');
  const range = req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
  if (range) {
    const start = Number(range[1]),
      end = Math.min(
        range[2] ? Number(range[2]) : data.length - 1,
        data.length - 1,
      );
    if (start > end) {
      res.writeHead(416, { 'Content-Range': `bytes */${data.length}` });
      res.end();
      return;
    }
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${data.length}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': end - start + 1,
    });
    res.end(req.method === 'HEAD' ? undefined : data.subarray(start, end + 1));
  } else {
    res.setHeader('Content-Length', data.length);
    res.end(req.method === 'HEAD' ? undefined : data);
  }
}
export function resourceMiddleware(root: string) {
  const absolute = resolve(root);
  return (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    void (async () => {
      const path = readDirectoryPath(
        new URL(req.url || '/', 'http://localhost').pathname,
      );
      if (path === null || path.split('/').some((p) => p.startsWith('.')))
        return next();
      const file = resolve(absolute, path),
        rel = relative(absolute, file);
      if (isAbsolute(rel) || rel === '..' || rel.startsWith('..' + sep))
        return next();
      // 与索引器一致：任何路径段都不能经过符号链接（包括 junction）。
      // 拒绝后直接结束响应，避免 Vite 的后续静态中间件再次提供该路径。
      const deny = () => {
        res.statusCode = 404;
        res.end('Not found');
      };
      let current = absolute;
      for (const segment of rel.split(sep).filter(Boolean)) {
        current = resolve(current, segment);
        const info = await lstat(current).catch(() => null);
        if (info?.isSymbolicLink()) return deny();
        if (!info) break;
      }
      const actualFile = await realpath(file).catch(() => null);
      if (actualFile) {
        const actualRoot = await realpath(absolute);
        const actualRelative = relative(actualRoot, actualFile);
        if (
          isAbsolute(actualRelative) ||
          actualRelative === '..' ||
          actualRelative.startsWith('..' + sep) ||
          actualRelative.split(sep).some((segment) => segment.startsWith('.'))
        )
          return deny();
      }
      const info = await stat(file).catch(() => null);
      if (info?.isFile()) return send(file, req, res);
      if (root === 'dist') {
        if (info?.isDirectory() && !path.endsWith('/') && path) {
          const target = new URL(req.url || '/', 'http://localhost');
          target.pathname = resourceUrl(path + '/');
          res.writeHead(308, { Location: target.pathname + target.search });
          res.end();
          return;
        }
        if (!path || path.endsWith('/'))
          return send(resolve(root, '_moecdn/app.html'), req, res);
      }
      next();
    })().catch((error) => {
      console.error(error);
      res.statusCode = 500;
      res.end('Internal server error');
    });
  };
}
export function serve(port: number) {
  const middleware = resourceMiddleware('dist');
  return createServer((req, res) =>
    middleware(req, res, () => {
      res.statusCode = 404;
      res.end('Not found');
    }),
  ).listen(port, '127.0.0.1', () => console.log(`http://127.0.0.1:${port}/`));
}
