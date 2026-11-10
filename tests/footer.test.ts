import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PageFooter } from '../src/components/PageFooter.tsx';
import { translator } from '../src/lib/i18n.ts';

describe('页脚版本', () => {
  it('显示七位提交号，链接保留完整提交号', () => {
    const revision = '1234567890abcdef1234567890abcdef12345678';
    const html = renderToStaticMarkup(
      createElement(PageFooter, {
        revision,
        path: null,
        navigate: () => {},
        t: translator('zh-CN'),
      }),
    );

    expect(html).toContain(
      `href="https://github.com/TomyJan/MoeCDN/commit/${revision}"`,
    );
    expect(html).toContain('>1234567</a>');
  });
});
