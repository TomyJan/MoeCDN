import { expect, it } from 'vitest';
import { resolveFileIcons } from '../scripts/icons.ts';

it.each([
  ['sample.py', 'python'],
  ['sample.sql', 'database'],
  ['sample.sh', 'console'],
  ['sample.ts', 'typescript'],
  ['sample.yaml', 'yaml'],
  ['sample.xml', 'xml'],
  ['sample.zip', 'zip'],
  ['Dockerfile', 'docker'],
  ['package.json', 'nodejs'],
  ['README.md', 'readme'],
])('按主题的完整文件关联识别 %s', (name, icon) => {
  expect(resolveFileIcons(name).icon).toBe(icon);
});

it('复合扩展名优先，大小写不影响匹配，未知格式使用主题默认文件图标', () => {
  expect(resolveFileIcons('sample.test.ts').icon).not.toBe('typescript');
  expect(resolveFileIcons('SAMPLE.PY')).toEqual(resolveFileIcons('sample.py'));
  expect(resolveFileIcons('unknown.moe-unknown').icon).toBe('file');
  for (const name of ['constructor', '__proto__', 'sample.constructor'])
    expect(resolveFileIcons(name).icon).toBe('file');
});

it('保留浅色主题的专用图标变体', () => {
  expect(resolveFileIcons('sample.toml')).toEqual({
    icon: 'toml',
    iconLight: 'toml_light',
  });
});
