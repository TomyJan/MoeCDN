# 素材与依赖来源

> 本文的来源、版本与字体托管计划对应 2026-10-28 的原型归档。当前应用依赖以根目录 `package.json` 和锁文件为准；当前字体与发布说明见[部署与资源维护](../docs/deployment.md)，演变过程见[实施记录](../docs/implementation.md)。

项目自有代码沿用根目录 MPL-2.0；以下第三方依赖、图标、字体保留各自许可，不因归档而变更许可证。

| 内容 | 来源 / 版本 | 许可 |
| --- | --- | --- |
| 操作图标 | [Lucide 1.17.0](https://unpkg.com/lucide@1.17.0/) | ISC，见 [许可](licenses/lucide-LICENSE) |
| 文件图标 | [VS Code Material Icon Theme](https://github.com/material-extensions/vscode-material-icon-theme)，2026-10-28 前获取的 SVG，嵌入于 data.js | MIT，见 [许可](licenses/material-icon-theme-LICENSE) |
| Markdown 解析 | [marked 15.0.12](https://github.com/markedjs/marked/tree/v15.0.12) | MIT，见 [许可](licenses/marked-LICENSE) |
| 内容清理 | [DOMPurify 3.2.6](https://github.com/cure53/DOMPurify/tree/3.2.6) | Apache-2.0 或 MPL-2.0，见 [许可](licenses/DOMPurify-LICENSE) |
| 主字体 | [MiSans](https://hyperos.mi.com/font/)，沿用旧站字体 CSS 指向的小米 WOFF2 分片，原型嵌入所需子集 | 以小米官方 MiSans 字体许可为准；旧仓库未附独立许可文本，正式发布时需补齐官方分发文件中的许可 |
| 预览西文字体 | [Source Code Pro](https://github.com/adobe-fonts/source-code-pro)，原型使用 Fontsource 5.0.8 的 BootCDN CSS | OFL-1.1，见 [许可](licenses/source-code-pro-LICENSE) |

Source Code Pro 当前链接：<https://cdn.bootcdn.net/ajax/libs/fontsource-source-code-pro/5.0.8/index.min.css>。后续迁移为本站托管；此处未承诺测速结果。

示例资源及其文件名、修改时间、哈希来自 `snapshot.json` 指定的旧版提交；原文件仍受各自许可证约束。原型仅保存索引，不将整个旧站资源再次分发到 master。

上游文件原有版权头保持不变。Material Icon Theme 的原始获取脚本未固定上游 commit，因此具体 SVG 以当前快照及其 SHA-256 为准。
