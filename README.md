# MoeCDN

MoeCDN [cdn.amoe.cc](https://cdn.amoe.cc) 的纯静态目录程序，面向 EO Makers 部署。

React / TypeScript 实现，支持递归搜索、文件预览、哈希与 SRI 复制、中英文、浅色与深色主题，提供独立的用户协议与隐私政策页。构建生成静态索引与页面，无需 PHP 或在线目录 API。

```sh
pnpm install --frozen-lockfile
pnpm dev
```

使用 `pnpm build` 构建到 `dist/`；`pnpm verify` 执行格式、代码、类型、单元测试、构建与原始资源校验；`pnpm test:e2e` 执行浏览器检查。

网站实际提供服务的静态资源在 `resources/`，推送后由 EO Makers 重新构建索引和部署。

- [当前架构](docs/architecture.md)与[部署及资源维护](docs/deployment.md)
- 更新历史维护在 [data/history.json](data/history.json)，网站页脚提供独立历史页面入口。
- [设计归档](design/README.md)与[冻结 HTML 原型](design/prototype/README.md)，仅供原型参考。
- [legacy 分支](https://github.com/TomyJan/MoeCDN/tree/legacy)：2026 年 10 月 28 日以前使用的 h5ai 旧站归档。

沿用 [MPL-2.0](LICENSE) 许可证；原型内的第三方素材和依赖见 [来源说明](design/ASSETS.md)。
