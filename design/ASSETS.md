# 素材与依赖来源

> 本文记录归档原型的素材来源与许可。当前应用依赖以根目录 `package.json` 和锁文件为准，字体与发布说明见[部署与资源维护](../docs/deployment.md)。

项目自有代码沿用根目录 MPL-2.0；以下第三方依赖、图标、字体保留各自许可，不因归档而变更许可证。

| 内容 | 来源 / 版本 | 许可 |
| --- | --- | --- |
| 操作图标 | [Lucide 1.17.0](https://unpkg.com/lucide@1.17.0/) | ISC，见 [许可](licenses/lucide-LICENSE) |
| 文件图标 | [VS Code Material Icon Theme](https://github.com/material-extensions/vscode-material-icon-theme)，2026-10-28 前获取的 SVG，嵌入于 data.js | MIT，见 [许可](licenses/material-icon-theme-LICENSE) |
| Markdown 解析 | [marked 15.0.12](https://github.com/markedjs/marked/tree/v15.0.12) | MIT，见 [许可](licenses/marked-LICENSE) |
| 内容清理 | [DOMPurify 3.2.6](https://github.com/cure53/DOMPurify/tree/3.2.6) | Apache-2.0 或 MPL-2.0，见 [许可](licenses/DOMPurify-LICENSE) |
| 主字体 | [MiSans](https://hyperos.mi.com/font/)，沿用旧站字体 CSS 指向的小米 WOFF2 分片，原型嵌入所需子集 | 以小米官方 MiSans 字体许可为准；归档未附独立许可文本 |
| 预览西文字体 | [Source Code Pro](https://github.com/adobe-fonts/source-code-pro)，原型使用 Fontsource 5.0.8 的 BootCDN CSS | OFL-1.1，见 [许可](licenses/source-code-pro-LICENSE) |

归档原型的 Source Code Pro 引用 <https://cdn.bootcdn.net/ajax/libs/fontsource-source-code-pro/5.0.8/index.min.css>；当前网站的字体 CSS 由本站提供，见部署说明。

示例资源及其文件名、修改时间、哈希来自 snapshot.json 指定的旧版提交，原文件仍受各自许可证约束。归档原型只保存索引，运行时由原型服务读取旧版资源；当前网站资源独立维护在 resources/。

上游文件原有版权头保持不变。Material Icon Theme 的原始获取脚本未固定上游 commit，因此具体 SVG 以当前快照及其 SHA-256 为准。
