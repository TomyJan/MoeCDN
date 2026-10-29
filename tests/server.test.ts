import { afterAll, beforeAll, expect, it } from 'vitest';
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resourceMiddleware } from '../scripts/server.ts';
import { tmpdir } from 'node:os';
import { join, parse, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createInterface } from 'node:readline';

let root: string, origin: string, child: ChildProcess;
beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), 'moecdn-server-'));
  await mkdir(join(root, 'dist/_moecdn'), { recursive: true });
  await writeFile(join(root, 'dist/_moecdn/app.html'), 'DIRECTORY APP');
  await writeFile(join(root, 'dist/asset.txt'), 'PUBLIC ASSET');
  for (const name of ['中文', 'hash#', 'percent%'])
    await mkdir(join(root, 'dist', name));
  const module = pathToFileURL(resolve('scripts/server.ts')).href;
  child = spawn(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `import { serve } from ${JSON.stringify(module)};
       const server = serve(0);
       server.on('listening', () => console.log('PORT:' + server.address().port));`,
    ],
    { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] },
  );
  origin = await new Promise<string>((resolveOrigin, reject) => {
    child.once('error', reject);
    child.once('exit', (code) => reject(new Error('Server exited: ' + code)));
    const lines = createInterface({ input: child.stdout! });
    lines.on('line', (line) => {
      if (line.startsWith('PORT:')) {
        resolveOrigin('http://127.0.0.1:' + line.slice(5));
        lines.close();
      }
    });
  });
});
afterAll(async () => {
  if (child && child.exitCode === null) {
    const closed = new Promise<void>((resolveClosed) =>
      child.once('close', () => resolveClosed()),
    );
    child.kill();
    await closed;
  }
  if (root) await rm(root, { recursive: true, force: true });
});

it('本地服务仍可按原内容读取公开资源', async () => {
  const response = await fetch(origin + '/asset.txt');
  expect(response.status).toBe(200);
  expect(await response.text()).toBe('PUBLIC ASSET');
});

it('目录链接不能公开根目录外或隐藏文件，也不能交给后续静态中间件', async () => {
  await mkdir(join(root, 'outside'));
  await mkdir(join(root, 'dist/.hidden'));
  await writeFile(join(root, 'outside/secret.txt'), 'OUTSIDE SECRET');
  await writeFile(join(root, 'dist/.hidden/secret.txt'), 'HIDDEN SECRET');
  await writeFile(join(root, 'dist/中文/secret.txt'), 'ORDINARY TARGET');
  for (const [name, target] of [
    ['external-link', join(root, 'outside')],
    ['hidden-link', join(root, 'dist/.hidden')],
    ['internal-link', join(root, 'dist/中文')],
  ]) {
    await symlink(
      target,
      join(root, 'dist', name),
      process.platform === 'win32' ? 'junction' : 'dir',
    );
  }
  const middleware = resourceMiddleware(join(root, 'dist'));
  const server = createServer((req, res) =>
    middleware(req, res, () => res.end('VITE FALLTHROUGH')),
  );
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
  const address = server.address() as { port: number };
  try {
    for (const path of [
      '/external-link/secret.txt',
      '/hidden-link/secret.txt',
      '/internal-link/secret.txt',
      '/external-link/',
    ]) {
      const response = await fetch(`http://127.0.0.1:${address.port}${path}`);
      expect(response.status).toBe(404);
      expect(await response.text()).toBe('Not found');
    }
    const response = await fetch(`http://127.0.0.1:${address.port}/asset.txt`, {
      headers: { Range: 'bytes=0-5' },
    });
    expect(response.status).toBe(206);
    expect(await response.text()).toBe('PUBLIC');
  } finally {
    await new Promise<void>((done, reject) =>
      server.close((error) => (error ? reject(error) : done())),
    );
  }
});

it.skipIf(
  process.platform !== 'win32' ||
    parse(tmpdir()).root.toLowerCase() ===
      parse(process.cwd()).root.toLowerCase(),
)('跨盘符请求不能读取资源目录外的文件', async () => {
  const path = resolve('package.json').replaceAll('\\', '/');
  const response = await fetch(origin + '/' + path);
  expect(response.status).toBe(404);
  expect(await response.text()).toBe('Not found');
});

it.each([
  ['%E4%B8%AD%E6%96%87', '/%E4%B8%AD%E6%96%87/'],
  ['hash%23', '/hash%23/'],
  ['percent%25', '/percent%25/'],
])('特殊字符目录 %s 重定向后仍访问同一目录', async (path, target) => {
  const response = await fetch(origin + '/' + path, { redirect: 'manual' });
  expect(response.status).toBe(308);
  expect(response.headers.get('location')).toBe(target);
  expect(await (await fetch(origin + target)).text()).toBe('DIRECTORY APP');
});
