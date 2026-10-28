# MoeCDN

[cdn.amoe.cc](https://cdn.amoe.cc) 的新版纯静态目录程序，面向 EO Makers 部署。

React / TypeScript 实现，支持递归搜索、文件预览、哈希与 SRI 复制、中英文、浅色与深色主题。构建生成静态索引与页面，无需 PHP 或在线目录 API。

```sh
pnpm install --frozen-lockfile
pnpm dev
```

运行版本由 [package.json](package.json)、[.nvmrc](.nvmrc) 与 [pnpm-lock.yaml](pnpm-lock.yaml) 管理。构建使用 `pnpm build`，输出到 `dist/`；`pnpm verify` 执行完整静态检查，`pnpm test:e2e` 执行浏览器检查。

文本预览支持独立切换语法高亮、行号与换行。超过 20 万字符、单行超过 2 万字符或超过 5,000 行时，使用保留完整原文的简化预览，并禁用这三项增强显示以保持响应；超过 2 MiB 的文本请下载或打开原文件。

将文件放入 `resources/`，对外 URL 保持从网站根目录开始，例如 `resources/lib/a.js` 发布为 `/lib/a.js`。推送后由 EO Makers 重新构建索引和部署。

- [部署与资源维护](docs/deployment.md)
- 更新历史维护在 [data/history.json](data/history.json)，网站页脚提供独立历史页面。
- [已确认设计](design/README.md)与[原始 HTML 原型](design/prototype/README.md)
- [legacy 分支](https://github.com/TomyJan/MoeCDN/tree/legacy)：2026 年 10 月 28 日的 h5ai 旧站归档。

沿用 [MPL-2.0](LICENSE) 许可证；原型内的第三方素材和依赖见 [来源说明](design/ASSETS.md)。
