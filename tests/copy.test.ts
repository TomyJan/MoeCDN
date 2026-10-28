import { expect, it } from 'vitest';
import { buildCopy, copyCapabilities } from '../src/lib/copy.ts';
import type { Entry } from '../src/lib/types.ts';
it('模块文件生成可在浏览器执行的 module 脚本标签', () => {
  const module: Entry = {
    name: 'pdf.mjs',
    path: 'pdf.mjs',
    parent: '',
    dir: false,
    size: 1,
    modifiedAt: '',
  };
  expect(
    buildCopy(
      module,
      { format: 'html', hash: 'sha384', sri: false, cors: false },
      'https://cdn.amoe.cc',
    ),
  ).toBe('<script type="module" src="https://cdn.amoe.cc/pdf.mjs"></script>');
});
const file: Entry = {
  name: 'a.js',
  path: '库/a.js',
  parent: '库/',
  dir: false,
  size: 3,
  modifiedAt: '',
  hashes: { sha384: { hex: '123', b64: 'YWJj' } },
};
const opts = { format: 'html', hash: 'sha384', sri: true, cors: true } as const;
it.each(['a.js', 'a.css'])(
  '仅启用 SRI 的 %s 也生成可跨站加载的标签',
  (name) => {
    const output = buildCopy(
      { ...file, name, path: '库/' + name },
      { ...opts, cors: false },
      'https://cdn.amoe.cc',
    );
    expect(output).toContain('integrity="sha384-YWJj"');
    expect(output).toContain('crossorigin="anonymous"');
  },
);
it('支持脚本 SRI，但已隐藏的选项不污染直链与 Markdown', () => {
  expect(buildCopy(file, opts, 'https://cdn.amoe.cc')).toBe(
    '<script src="https://cdn.amoe.cc/%E5%BA%93/a.js" integrity="sha384-YWJj" crossorigin="anonymous"></script>',
  );
  expect(
    buildCopy(file, { ...opts, format: 'url' }, 'https://cdn.amoe.cc'),
  ).toBe('https://cdn.amoe.cc/%E5%BA%93/a.js');
  expect(
    buildCopy(file, { ...opts, format: 'hash' }, 'https://cdn.amoe.cc'),
  ).toBe('123');
});
it('无哈希文件和不支持 HTML 的格式不暴露不可用选项', () => {
  expect(
    copyCapabilities({ ...file, name: 'a.zip', hashes: undefined }),
  ).toEqual({ html: false, sri: false, hash: false });
  expect(copyCapabilities({ ...file, hashes: undefined }).sri).toBe(false);
});
