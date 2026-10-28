# 静态目录程序实现计划

> 使用 executing-plans 在当前会话连续实施；以复现行为的测试、构建检查和最终审查验证。

**目标：** 将确认的设计实现为可由 pnpm 构建、部署到 EO Makers 的静态目录程序。

**架构：** React/TypeScript 客户端读取构建生成的索引，静态资源按原 URL 发布。构建时计算哈希、保留 Git 修改时间，目录页面与显式 index.html 分开路由。保留 design/prototype 原始快照。

**技术栈：** React、TypeScript、Vite、Tailwind、shadcn 风格的 Radix 组件、Lucide、Vitest、Playwright。

**规格：** design/requirements.md、design/foundations.md；版本在 package.json、pnpm-lock.yaml、.nvmrc 和平台配置中管理，不在安装/构建命令中拼版本。

## 全局约束

- 使用 pnpm，Node 运行版本不超过 EO 支持的 24.18.0。
- 中英文、灰阶主题、MiSans 和预览 Source Code Pro；保留已确认的全部交互。
- 历史资源从 legacy 的固定提交迁移，浏览 URL 不加源码目录前缀，不带 hash。
- CI 参照同级 HomePage / MoeURL：最小权限、锁文件安装、版本文件、检查与浏览器任务、Dependabot。
- 不推送或部署，不修改 design/prototype 的冻结文件。

## 审查重点

1. 带中文、空格、百分号和 HTML 特殊字符的路径：链接编码正确，预览/复制不注入 HTML。
2. 原生 index.html：目录 URL 显示目录，显式文件 URL 返回原字节；不存在的路径有明确提示。
3. 文件变动和空目录：每次构建刷新索引/哈希，Git 修改时间稳定，空搜索与零计数正确。
4. 隐藏的 SRI 选项：popup 生命周期中保留选择，但不污染不支持的复制格式。
5. 预览切换竞态、恶意 HTML/Markdown：旧请求取消，渲染禁用脚本，错误能恢复。

## 文件职责与任务

### 任务 1：构建与索引

- [x] 建立 package.json、锁文件、Node 与 pnpm 配置、Vite/TS/测试配置。
- [x] 在 tests/indexer.test.ts 定义真实临时资源目录测试：哈希、编码、排除私有文件、符号链接、修改后刷新；先运行失败。
- [x] scripts/indexer.ts 扫描资源、scripts/build.ts 生成目录页面和发布文件；src/lib/types.ts 定义索引协议。
- [x] 从固定 legacy 提交导入站点资源到 resources/，路径发布到网站根目录；不迁移 h5ai。
- [x] 验证原始资源不被覆盖、构建结果可通过真实 HTTP 访问。

### 任务 2：应用与组件

- [x] tests/catalog.test.ts、tests/copy.test.ts 定义递归搜索、排序和不同文件的复制输出，先运行失败。
- [x] src/lib/catalog.ts、copy.ts、i18n.ts 实现业务逻辑。
- [x] src/components/ 下实现导航、目录树、搜索/列表、高级复制、预览；src/App.tsx 管理真实路径状态。
- [x] src/styles.css 继承最终视觉约定；Tailwind 与 Radix 提供样式/交互基础，冻结原型保持原样。
- [x] Playwright 在浏览器验证目录直达/刷新、原生 index、递归搜索、popup、预览、语言/主题、窄屏和自动加载。

### 任务 3：自动检查与交付

- [x] .github/dependabot.yml 配置 npm / Actions 更新分组。
- [x] .github/workflows/code-check.yml 运行格式、lint、类型、测试、审计、构建和浏览器检查，上传结果。
- [x] README 和 docs/deployment.md 说明文件更新、构建命令、平台设置、路由及缓存策略。
- [x] 执行 pnpm verify 和 pnpm test:e2e；审查实现、修复重要问题，记录结果。

## 进度记录

起点：aee89faf。实施在 feat/static-directory 分支进行，保留 master 作为已确认设计基线。
