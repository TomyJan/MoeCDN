# 当前架构

当前应用位于 `src/`，使用 React、TypeScript、Vite、Tailwind CSS 与 Radix UI。通用组件基于 Radix 与项目样式实现，使用 class-variance-authority、clsx 和 tailwind-merge 组合样式。`design/` 是独立的冻结原型，不参与应用构建。

## 构建流程

1. [prepare.ts](../scripts/prepare.ts) 调用 [indexer.ts](../scripts/indexer.ts) 扫描 `resources/`，生成目录、文件摘要、时间、README 关联和图标信息，写入 `public/_moecdn/catalog.json`。索引结构见 [types.ts](../src/lib/types.ts)。
2. 准备阶段同时复制更新历史、图标、站点图标、PDF 支持文件及相关许可到 `public/`。
3. [build.ts](../scripts/build.ts) 执行 Vite 构建，生成 `dist/_moecdn/app.html`，再按原字节复制资源，为没有原生 `index.html` 的目录及独立页面补齐入口。
4. [edgeone.json](../edgeone.json) 将目录 URL 重写到应用入口；显式文件 URL 直接提供原文件。部署规则、保留路径和资源时间规则见[部署说明](deployment.md)。

`public/`、`dist/` 都是生成目录。前端运行时读取静态 JSON，不需要目录 API；推送资源后的索引更新由平台重新构建完成。

## 运行时职责

| 模块                                                                                                             | 职责                                                  |
| ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| [App.tsx](../src/App.tsx)、[useDirectoryHistory.ts](../src/lib/useDirectoryHistory.ts)                           | 目录路由、排序与滚动状态、主题和语言、弹层协调        |
| [catalog.ts](../src/lib/catalog.ts)、[DirectoryTree.tsx](../src/components/DirectoryTree.tsx)                    | 目录筛选、路径编码和树状导航                          |
| [SearchDialog.tsx](../src/components/SearchDialog.tsx)                                                           | 默认递归搜索当前目录，可切换全站；结果独立展示        |
| [Preview.tsx](../src/components/Preview.tsx)                                                                     | 识别文件类型，协调文本、图片、音视频、字体和 PDF 预览 |
| [syntax.ts](../src/lib/syntax.ts)、[CodePreview.tsx](../src/components/CodePreview.tsx)                          | 源码语言匹配、高亮、行号、换行与长文本虚拟化          |
| [DocumentPreview.tsx](../src/components/DocumentPreview.tsx)、[PdfPreview.tsx](../src/components/PdfPreview.tsx) | HTML / Markdown 的源码、渲染和对照模式；PDF 按需绘制  |
| [AdvancedCopy.tsx](../src/components/AdvancedCopy.tsx)、[copy.ts](../src/lib/copy.ts)                            | 链接与引用格式、哈希和 SRI 复制                       |
| [DirectoryReadme.tsx](../src/components/DirectoryReadme.tsx)、[markdown.ts](../src/lib/markdown.ts)              | 目录 README 渲染、标题目录与内容清理                  |
| [HistoryPage.tsx](../src/components/HistoryPage.tsx)、[LegalPage.tsx](../src/components/LegalPage.tsx)           | 更新历史、用户协议与隐私政策页面                      |
| [consent.tsx](../src/lib/consent.tsx)、[ConsentNotice.tsx](../src/components/ConsentNotice.tsx)                  | 条款确认记录与底部告知，控制预览和复制功能            |

目录与搜索结果每批显示 100 项，接近底部自动续载。README 单独登记，不出现在列表、统计或搜索结果中。文本预览上限为 2 MiB；长源码使用 CodeMirror 虚拟化，高亮由 worker 处理。预览限制不影响原文件访问。

## 维护入口

- 界面文案：[i18n.ts](../src/lib/i18n.ts)；通用组件：[ui.tsx](../src/components/ui.tsx)；样式：[styles.css](../src/styles.css)、[components.css](../src/components.css)。
- 条款正文、确认版本：[legal.ts](../src/lib/legal.ts)；更新规则及确认行为见[部署说明](deployment.md#条款与确认状态)。
- 资源：[resources/](../resources/)；网页根目录说明：[resources/README.md](../resources/README.md)；更新历史：[data/history.json](../data/history.json)。
- 字体 CSS 与 Umami 引用：[index.html](../index.html)；文件图标关联：[icons.ts](../scripts/icons.ts)。
- 版本约束：[package.json](../package.json)、[pnpm-lock.yaml](../pnpm-lock.yaml)、[.nvmrc](../.nvmrc)；代码检查与依赖更新：[.github/](../.github/)。

目录和路由等单元检查位于 `tests/`，构建产物校验由 [verify-build.ts](../scripts/verify-build.ts) 执行；浏览器检查范围和运行命令见[部署说明](deployment.md#本地验证)。
