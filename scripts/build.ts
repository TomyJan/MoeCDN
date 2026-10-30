import { cp, mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { build } from 'vite';
import { prepare } from './prepare.ts';
const catalog = await prepare();
await build();
const shell = await readFile('dist/index.html', 'utf8');
await writeFile('dist/_moecdn/app.html', shell);
for (const f of [
  ...catalog.entries,
  ...Object.values(catalog.readmes || {}).flat(),
]) {
  if (f.dir) await mkdir('dist/' + f.path, { recursive: true });
  else {
    await mkdir('dist/' + f.parent, { recursive: true });
    await cp('resources/' + f.path, 'dist/' + f.path);
  }
}
for (const path of ['history/', 'terms/', 'privacy/'])
  await mkdir('dist/' + path, { recursive: true });
for (const path of [
  '',
  'history/',
  'terms/',
  'privacy/',
  ...catalog.entries.filter((f) => f.dir).map((f) => f.path),
]) {
  const destination = 'dist/' + path + 'index.html';
  if (
    !(await access(destination).then(
      () => true,
      () => false,
    ))
  )
    await writeFile(destination, shell);
}
console.log('静态站点已生成：dist/');
