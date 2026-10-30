# 部署与资源维护

## EO Makers

将 GitHub 仓库的正式发布分支连接到 EO Makers，使用仓库根目录和“其他 / Vite”构建类型，启用推送自动部署。构建与安装命令、输出目录、Node 运行版本由根目录 `edgeone.json` 管理；pnpm 版本从 `package.json` 的 `packageManager` 读取。

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm build
```

代码检查位于 `.github/workflows/code-check.yml`，包含格式、ESLint、类型检查、单元测试、生产依赖审计、完整静态构建和 Playwright 检查。CI 从 `.nvmrc` 读取 Node，从 `package.json` 读取 pnpm，不在命令中重复指定版本。

GitHub Actions 只检查并保存构建产物，不持有发布凭据。平台的 Git 集成负责自动发布；项目、域名和发布分支在平台账户中配置。

## 添加和更新文件

资源源码位于 `resources/`，构建后去掉此前缀，保持旧站的实际 URL。添加、替换或删除资源后提交并推送，即可在下次部署时刷新目录、搜索索引、文件大小与 SHA-256/384/512。不需要手写文件清单。

`resources/.metadata.json` 只用于保留迁移时已有的修改时间：只有内容 SHA-256 与迁移记录一致时才采用该时间；新文件或变化后的文件使用 Git 最近修改提交的时间。无 Git 记录时回退到文件系统修改时间。CI 使用完整 Git 历史；EO 构建若使用浅克隆，必要时在平台开启完整历史拉取，以免历史时间退化。

隐藏文件、隐藏目录、符号链接不会发布或编入索引。资源根目录中的 `_moecdn`、`history`、`terms`、`privacy` 为程序保留，不能用作文件名或目录名。当前构建限制单文件不超过 25 MiB，超出时明确失败。

项目构建与部署配置只在仓库根目录维护，不放入 `resources/` 或复制到 `dist/`。EO 从仓库根目录读取 `edgeone.json`；资源根目录出现同名配置时构建会明确失败，发布验证也会检查部署配置未被公开。

站点更新历史维护在 `data/history.json`，每项包含 `date`、可选 `note` 和 `changes` 数组；`changes` 中的条目支持行内 Markdown，`note` 按纯文本显示。构建发布到 `/_moecdn/history.json`，访问 `/history/` 查看独立页面。仅记录重要更新；资源变动保留相对路径，避免记录逐项开发过程。站点图标源文件为 `src/assets/favicon.ico`，发布在 `/favicon.ico`，不进入资源列表。

`public/` 是生成目录，不能手动维护；`dist/` 也是生成目录，每次构建清空并重新生成。程序源码、设计归档、锁文件和资源元数据均不进入网站资源列表。

`pnpm dev` 只在启动时生成索引和支持文件。修改 `resources/`、`data/history.json` 或需刷新页脚提交版本时，重启开发服务；应用源码的 Vite 热更新不等同于重新生成索引。

## 目录说明与测试文件

在任意 `resources/` 子目录放置 `README.md`，构建会单独登记目录说明，页面在完整列表下方渲染当前目录的 README。支持 Markdown 标题目录、表格、代码块和相对图片 / 链接；目录内链接保留站内导航，原文件与外链在新标签页打开。脚本、事件属性、危险链接等内容会清理。

README 文件名不区分大小写，同一目录优先使用 `README.md`；这些文件均不进入列表、统计或搜索索引，但仍按原字节发布并接受哈希验证。搜索使用独立浮层，不改变背景目录列表和 README。根目录网页说明维护在 `resources/README.md`，仓库根目录的 `README.md` 仍是开发说明。

网站 `/test/` 对应 `resources/test/`，提供可直接查看和下载的多格式小样例；字体样例的授权文件与其一起保留。

## 路由

页面使用 History API，地址直接为 `/lib/`、`/web-static/`，不带 `#`。EO 的普通重写将 `/` 与以 `/` 结束的目录地址映射到内部静态页面 `/_moecdn/app.html`；显式的文件 URL 不匹配这两条规则，原始文件内容得以保留。

构建会为没有原生 `index.html` 的目录生成入口；已有 `index.html` 则保持原字节。访问 `/某目录/` 显示目录程序，访问 `/某目录/index.html` 显示资源原网页。该规则区别于 EO 对 `/* → /index.html` 的特殊 SPA fallback，不依赖在线函数。

目录必须使用末尾斜杠；应用内部链接均生成规范地址。本地预览会重定向已存在目录的无斜杠请求，EO 的目录规范化行为需在部署后核对。未知文件返回 404，未知的末尾斜杠路径进入应用并显示“目录不存在”（静态重写的 HTTP 状态仍为 200）。

配置参考：[edgeone.json 重写和缓存响应头](https://pages.edgeone.ai/document/edgeone-json)。部署后应验证 `/`、多级目录直达/刷新、原生 `index.html`、`/history/`、`/terms/`、`/privacy/`、中文与百分号文件名、音视频和 CORS/SRI。平台真实响应需在部署环境中确认。

## 缓存、字体与预览

根配置将索引、更新历史和应用入口设为 `no-cache`，带内容哈希的 `/_moecdn/assets/*` 设为一年缓存及 `immutable`。不要为索引或入口叠加持久缓存规则；部署后核对实际响应头与索引版本。如模块请求返回 HTML，先检查安全校验、重写和缓存响应，不能只修改 MIME 响应头。

MiSans 和 Source Code Pro 通过 `<link>` 引用 `web-static/public/font/` 下的 CSS，字体文件分别由小米 CDN 和 npmmirror 提供。Source Code Pro 许可随字体 CSS 发布，其他第三方许可见设计说明及 `/_moecdn/licenses/`；旧站资源遵循其各自原有许可。

文件图标使用 VS Code 的 Material Icon Theme（并非 VS Code 内置的默认文件主题）。构建时读取依赖包的完整文件名与扩展名关联，优先匹配专用文件名及复合扩展名，再匹配普通扩展名；按当前资源需求复制所需图标及默认图标，并随网站主题切换浅色变体。复用 `public/` 生成目录时，其中可能保留先前复制的旧图标。新增格式无需手写前端映射。

`edgeone.json` 已为所有路径配置 `Access-Control-Allow-Origin: *`，允许任意网站跨域读取公共资源，适用于脚本、字体、`fetch` 和 SRI 引用。本地开发资源与生产预览服务同样返回此响应头；平台实际响应在部署后验证。

HTML 与 Markdown 预览使用不授予脚本权限的 sandbox iframe，Markdown 额外经 DOMPurify 清理。文内锚点由父页面处理，仅滚动预览正文；普通链接（包括开放 Shadow DOM 中的链接）在新标签页打开，均不改变目录的浏览历史。同源的嵌套 iframe、object 和 embed 文档沿用这些交互；焦点进入正文后仍可按 Esc 关闭弹窗并恢复焦点。正文大于预览上限或不支持的类型提供打开原文件和下载；原始文件的可访问性不受预览上限影响。文件预览不会自动执行文件内脚本。

文本预览上限为 2 MiB，不适用于图片、音视频、字体和 PDF 的预览加载。文本按 UTF-8 解码，失败时回退到 GB18030；HTML 和 Markdown 默认渲染，可切换源码和左右对照。源码的语法高亮、行号、换行默认开启，仅在适用类型和模式下显示。

PDF 使用按需加载的 PDF.js 在 canvas 上逐页绘制，靠近视口时才渲染页面，不使用浏览器内置 PDF 插件，也不接入 PDF 脚本或交互动作。Worker、字符映射、字体和解码器均随站点发布。

## 条款与确认状态

`/terms/` 为用户协议，`/privacy/` 为隐私政策；页脚与底部 Cookie 告知均提供入口。中英文正文及 `policyVersion` 维护在 `src/lib/legal.ts`。更新条款时同步调整该版本，页面更新日期和重新确认均使用此值。

`src/lib/consent.tsx` 将 `{ version, acceptedAt }` 保存到本地存储 `moecdn.consent`。未确认当前版本时，预览、复制文件或目录链接、高级复制不可用；仍可浏览目录、搜索和阅读条款。版本不匹配或记录损坏会重新提示，跨标签页同步确认状态；存储不可用时，确认仍在当前页面会话内生效。

此确认只控制界面功能，静态文件直链仍可访问。确认状态不改变现有 Umami 初始化与统计行为。权益和隐私联系入口为项目仓库的 Issues，条款提醒用户不要在公开页面提交敏感资料。

## 访问统计

Umami 使用 `https://umami.amoe.cc/script.js`，website ID 为 `da133a13-5739-44d4-ae2d-7025ff791b9a`，配置位于根目录 `index.html`。脚本延后执行，使用其自动页面跟踪；正式统计域名限定为 `cdn.amoe.cc` 和 `cdn.vov.moe`，本地与平台预览域名不发送统计事件。新增正式域名时需同步更新 `data-domains`。

## 本地验证

```sh
pnpm verify
pnpm exec playwright install chromium
pnpm test:e2e
pnpm preview
```

预览服务只监听本机地址，默认端口显示在命令输出中。测试通过真实构建产物检查资源原字节、目录路由、搜索和弹窗交互；`pnpm verify:build` 会逐个核对索引中原始资源（含目录 README）的 SHA-256，范围不包括全部 `dist/` 生成资产。
