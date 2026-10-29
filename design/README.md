# 设计归档

本目录固化 2026 年 10 月 28 日经逐轮确认的 MoeCDN 历史设计与原型。下列文档中的技术方向、交互、字体来源及依赖版本描述该设计阶段，后续实现已有调整；当前行为与部署以[部署与资源维护](../docs/deployment.md)为准，演变过程见[实施记录](../docs/implementation.md)。

- [需求与交互](requirements.md)
- [组件基础样式](foundations.md)
- [技术选型与部署约束](architecture.md)
- [原型运行说明](prototype/README.md)
- [素材来源与许可](ASSETS.md)
- [快照验证记录](verification.md)

`prototype/index.html`、`style.css`、`app.js` 是最终设计本体。原型采用原生 HTML/CSS/JavaScript，包含真实索引、搜索、复制、文件预览和响应式布局。它不等同于已完成的正式应用。

`prototype/snapshot.json` 记录原型文件的 SHA-256 与示例资源版本。只保存最终设计，不保留中间稿、转换脚本或依赖本机绝对路径的临时文件。
