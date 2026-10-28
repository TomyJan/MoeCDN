import { expect, it } from 'vitest';
import {
  selectEntries,
  resourceUrl,
  readDirectoryPath,
} from '../src/lib/catalog.ts';
import type { Entry, Sort } from '../src/lib/types.ts';

it.each([
  ['name', ['folder', 'a.txt', 'b.txt', 'c.txt']],
  ['name-desc', ['folder', 'c.txt', 'b.txt', 'a.txt']],
  ['size', ['folder', 'a.txt', 'c.txt', 'b.txt']],
  ['size-asc', ['folder', 'b.txt', 'c.txt', 'a.txt']],
  ['date', ['folder', 'a.txt', 'b.txt', 'c.txt']],
  ['date-asc', ['folder', 'c.txt', 'b.txt', 'a.txt']],
] as [Sort, string[]][])(
  '排序 %s 保持目录在前并按字段和方向排序',
  (sort, expected) => {
    const files: Entry[] = [
      {
        name: 'b.txt',
        path: 'b.txt',
        parent: '',
        dir: false,
        size: 10,
        modifiedAt: '2026-10-26T00:00:00Z',
      },
      {
        name: 'a.txt',
        path: 'a.txt',
        parent: '',
        dir: false,
        size: 30,
        modifiedAt: '2026-10-27T00:00:00Z',
      },
      {
        name: 'folder',
        path: 'folder/',
        parent: '',
        dir: true,
        size: null,
        modifiedAt: '',
      },
      {
        name: 'c.txt',
        path: 'c.txt',
        parent: '',
        dir: false,
        size: 20,
        modifiedAt: '',
      },
    ];
    expect(
      selectEntries(files, '', '', 'current', sort).map((file) => file.name),
    ).toEqual(expected);
  },
);
it('最近修改按实际时间排序，兼容提交时间的时区偏移', () => {
  const files: Entry[] = [
    {
      name: 'earlier.txt',
      path: 'earlier.txt',
      parent: '',
      dir: false,
      size: 1,
      modifiedAt: '2026-10-28T23:00:00+08:00',
    },
    {
      name: 'later.txt',
      path: 'later.txt',
      parent: '',
      dir: false,
      size: 1,
      modifiedAt: '2026-10-28T17:00:00Z',
    },
  ];
  expect(
    selectEntries(files, '', '', 'current', 'date').map((f) => f.name),
  ).toEqual(['later.txt', 'earlier.txt']);
});
const entries: Entry[] = [
  { name: 'a', path: 'a/', parent: '', dir: true, size: null, modifiedAt: '' },
  {
    name: 'x.js',
    path: 'a/deep/x.js',
    parent: 'a/deep/',
    dir: false,
    size: 10,
    modifiedAt: '',
  },
  {
    name: 'x.js',
    path: 'ab/x.js',
    parent: 'ab/',
    dir: false,
    size: 3,
    modifiedAt: '',
  },
];
it('当前搜索包含任意深度子目录但不包含相似前缀目录', () => {
  expect(
    selectEntries(entries, 'a/', 'x', 'current', 'name').map((f) => f.path),
  ).toEqual(['a/deep/x.js']);
  expect(
    selectEntries(entries, 'a/', 'x', 'global', 'size').map((f) => f.path),
  ).toEqual(['a/deep/x.js', 'ab/x.js']);
  expect(selectEntries(entries, 'a/', '', 'current', 'name')).toEqual([]);
});
it('原始路径只编码一次，编码分隔符与畸形转义不被解释成目录', () => {
  expect(resourceUrl('中 文/100%#?.js')).toBe(
    '/%E4%B8%AD%20%E6%96%87/100%25%23%3F.js',
  );
  expect(readDirectoryPath('/%E4%B8%AD%20%E6%96%87/')).toBe('中 文/');
  expect(readDirectoryPath('/bad%zz/')).toBe(null);
  expect(readDirectoryPath('/a%2Fb/')).toBe(null);
});
