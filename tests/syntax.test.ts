import { expect, it } from 'vitest';
import { sourceFormat, syntaxLanguage } from '../src/lib/syntax.ts';
import { highlightLines, highlightRanges } from '../src/lib/highlight.ts';

it.each([
  ['JS', 'javascript'],
  ['.mjs', 'javascript'],
  ['cjs', 'javascript'],
  ['cts', 'typescript'],
  ['mts', 'typescript'],
  ['less', 'less'],
  ['scss', 'scss'],
  ['sass', 'scss'],
  ['markdown', 'markdown'],
  ['bash', 'bash'],
  ['zsh', 'bash'],
  ['python', 'python'],
  ['rs', 'rust'],
  ['h', 'c'],
  ['hpp', 'cpp'],
  ['cs', 'csharp'],
  ['rb', 'ruby'],
  ['gql', 'graphql'],
  ['jsonc', 'json'],
  ['xhtml', 'xml'],
  ['xsd', 'xml'],
  ['txt', undefined],
  ['wasm', undefined],
])('语言映射 %s 与预览扩展名一致', (extension, language) => {
  expect(syntaxLanguage(extension)).toBe(language);
});

it.each([
  'LICENSE_FOXIT',
  'LICENSE-MIT',
  'license',
  'COPYING',
  'NOTICE.txt',
  'messages.po',
  'view.ftl',
  'lyrics.lrc',
])('%s 作为纯文本预览', (name) => {
  expect(sourceFormat(name)).toMatchObject({ text: true, language: undefined });
});

it.each([
  'sample.wasm',
  'font.pfb',
  'sample.mo',
  'sample.bcmap',
  'data.icc',
  'archive.tar.gz',
  'sample.bin',
])('%s 不误判为文本', (name) => {
  expect(sourceFormat(name).text).toBe(false);
});

it.each([
  ['Dockerfile.dev', 'dockerfile'],
  ['Makefile', 'makefile'],
  ['CMakeLists.txt', 'cmake'],
  ['.env.production', 'ini'],
  ['.zshrc', 'bash'],
  ['.bash_profile', 'bash'],
  ['Gemfile', 'ruby'],
])('%s 使用已注册的命名文件语法', (name, language) => {
  expect(sourceFormat(name)).toMatchObject({ text: true, language });
  expect(() => highlightLines('value = 42', language)).not.toThrow();
});

it.each(['readme.markdown', 'README.mdown', 'help.mkd'])(
  '%s 支持 Markdown 渲染',
  (name) => {
    expect(sourceFormat(name).document).toBe('markdown');
  },
);

it('未识别的名称不会通过对象原型误匹配', () => {
  for (const name of ['constructor', '__proto__', 'toString'])
    expect(sourceFormat(name)).toMatchObject({
      text: false,
      language: undefined,
    });
});

it('高亮保持空行、CRLF、末尾换行，并转义所有源文件 HTML', () => {
  const source =
    '\r\nconst html = `<img src=x onerror="alert(1)">\n\n</span>&copy;`;\r\n';
  const html = highlightLines(source, 'javascript').join('\n');
  expect(html).not.toContain('<img');
  expect(html).toContain('&lt;img');
  const plain = html
    .replace(/<\/?span(?: [^>]*)?>/g, '')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&#13;', '\r')
    .replaceAll('&amp;', '&');
  expect(plain).toBe(source);
});

it('可视区高亮使用原字符串的 UTF-16 偏移，覆盖中文和表情后的 token', () => {
  const text = '// 中文😀\nconst answer = 42;\n';
  const ranges = highlightRanges(text, 'javascript');
  const keyword = ranges.find((range) =>
    range.classes.includes('hljs-keyword'),
  )!;
  expect(text.slice(keyword.from, keyword.to)).toBe('const');
  for (let index = 0; index < ranges.length; index++) {
    expect(ranges[index].from).toBeGreaterThanOrEqual(
      index ? ranges[index - 1].to : 0,
    );
    expect(ranges[index].to).toBeLessThanOrEqual(text.length);
  }
});
