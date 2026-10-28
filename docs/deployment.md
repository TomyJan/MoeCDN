# 部署与资源维护

## EO Makers

将 GitHub 仓库的正式发布分支连接到 EO Makers，使用仓库根目录和“其他 / Vite”构建类型，启用推送自动部署。构建与安装命令、输出目录、Node 运行版本由根目录 `edgeone.json` 管理；pnpm 版本从 `package.json` 的 `packageManager` 读取。

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm build
```

代码检查位于 `.github/workflows/code-check.yml`，包含格式、ESLint、类型检查、单元测试、生产依赖审计、完整静态构建和 Playwright 检查。CI 从 `.nvmrc` 读取 Node，从 `package.json` 读取 pnpm，不在命令中重复指定版本。

GitHub Actions 只检查并保存构建产物，不持有发布凭据。平台的 Git 集成负责自动发布；将项目接入平台、域名和生产发布仍需在账户中配置。本次实现不代表已经执行上线。

## 添加和更新文件

资源源码位于 `resources/`，构建后去掉此前缀，保持旧站的实际 URL。添加、替换或删除资源后提交并推送，即可在下次部署时刷新目录、搜索索引、文件大小与 SHA-256/384/512。不需要手写文件清单。

`resources/.metadata.json` 只用于保留迁移时已有的修改时间：只有内容 SHA-256 与迁移记录一致时才采用该时间；新文件或变化后的文件使用 Git 最近修改提交的时间。无 Git 记录时回退到文件系统修改时间。CI 使用完整 Git 历史；EO 构建若使用浅克隆，必要时在平台开启完整历史拉取，以免历史时间退化。

隐藏文件、隐藏目录、符号链接不会发布或编入索引。`_moecdn/` 与 `history/` 为程序保留，不可作为资源目录。构建检查单文件大小，超过 EO 限制时会明确失败。

站点更新历史维护在 `data/history.json`，每项包含 `date`、可选 `note` 和 `changes` 数组，支持行内 Markdown。该文件由旧日志完整迁移，并由构建发布到 `/_moecdn/history.json`；访问 `/history/` 查看独立页面。站点图标源文件为 `src/assets/favicon.ico`，发布在 `/favicon.ico`，不进入资源列表。

`public/` 是生成目录，不能手动维护；`dist/` 也是生成目录，每次构建清空并重新生成。程序源码、设计归档、锁文件和资源元数据均不进入网站资源列表。

## 路由

页面使用 History API，地址直接为 `/lib/`、`/web-static/`，不带 `#`。EO 的普通重写将 `/` 与以 `/` 结束的目录地址映射到内部静态页面 `/_moecdn/app.html`；显式的文件 URL 不匹配这两条规则，原始文件内容得以保留。

构建会为没有原生 `index.html` 的目录生成入口；已有 `index.html` 则保持原字节。访问 `/某目录/` 显示目录程序，访问 `/某目录/index.html` 显示资源原网页。该规则区别于 EO 对 `/* → /index.html` 的特殊 SPA fallback，不依赖在线函数。

目录必须使用末尾斜杠；应用内部链接均生成规范地址。本地预览会重定向已存在目录的无斜杠请求，EO 的目录规范化行为须在首次平台预览中一并核对。未知文件返回 404，未知的末尾斜杠路径进入应用并显示“目录不存在”（静态重写的 HTTP 状态仍为 200）。

官方说明：[edgeone.json 重写和缓存响应头](https://pages.edgeone.ai/document/edgeone-json)。首次上线应验证 `/`、多级目录直达/刷新、原生 `index.html`、中文与百分号文件名、音视频和 CORS/SRI。平台真实响应只能在部署预览中确认，本地检查不能替代该步骤。

## 缓存、字体与预览

索引与应用入口设置为 `no-cache`；打包后带内容哈希的程序资产可以长缓存。EO 会在新部署后刷新边缘缓存，不为索引另设持久边缘缓存规则。

MiSans 沿用确认设计中的字体分片，Source Code Pro 从依赖包发布到本站，无运行时第三方字体 CDN 依赖。字体与图标的第三方许可保留在设计说明及发布的 `/_moecdn/licenses/` 中；旧站资源遵循其各自原有许可。

HTML 与 Markdown 预览使用不授予脚本权限的 sandbox iframe，Markdown 额外经 DOMPurify 清理。正文大于预览上限或不支持的类型提供打开原文件和下载；原始文件的可访问性不受预览上限影响。文件预览不会自动执行文件内脚本。

PDF 使用按需加载的 PDF.js 在 canvas 上逐页绘制，靠近视口时才渲染页面，不使用浏览器内置 PDF 插件，也不接入 PDF 脚本或交互动作。Worker、字符映射、字体和解码器均随站点发布。

## 本地验证

```sh
pnpm verify
pnpm exec playwright install chromium
pnpm test:e2e
pnpm preview
```

预览服务只监听本机地址，默认端口显示在命令输出中。测试通过真实构建产物检查资源原字节、目录路由、搜索和弹窗交互；`pnpm verify:build` 会逐个核对发布文件的 SHA-256。
