# 最终交互原型

这是 2026 年 10 月 28 日确认的设计快照，包含完整 HTML、CSS、脚本、图标、MiSans 字体和固定资源索引。不要直接通过 `file://` 打开；路径路由与文件预览需要本地 HTTP 服务。

## 运行

需要 Python 3.10+ 和 Git。在仓库根目录执行：

```sh
python design/serve.py
```

打开 <http://127.0.0.1:4178/>。可用 `--port 4179` 更换端口。服务只监听 `127.0.0.1`。

默认通过 `git archive` 将 `snapshot.json` 中固定的旧版提交解压到临时目录，使用其中的原文件作为示例资源；退出后清理临时文件，不切换分支、不修改工作区。该提交保留在本仓库的 `legacy` 历史中，浅克隆缺失时先执行 `git fetch origin legacy`。

也可使用本地现成的旧版资源目录：

```sh
python design/serve.py --resources /path/to/legacy-checkout
```

资源目录应与快照版本匹配；不同版本的文件内容、哈希和索引可能不一致。资源体积较大，首次导出需要一点时间。本机已有 Git 对象时，此步骤不需要联网。

## 内容与边界

- `index.html` / `style.css` / `app.js`：最终界面与可交互行为。
- `data.js`：4,962 个文件与 312 个目录的固定索引、真实哈希、嵌入图标。
- `fonts.css`：嵌入 MiSans 子集；Source Code Pro 使用 BootCDN，加载仍需要联网。
- `lucide.js` / `marked.js` / `purify.js`：本地保存的第三方依赖。
- `snapshot.json`：资源提交号和以上八个原始文件的 SHA-256，可核对设计快照未被改写。

浏览器使用现代 CSS、Web Animations、dialog 和 Popover API，请用近期版本浏览器查看。真实路径支持直接访问、刷新和前进后退，显式 `index.html` 返回原 HTML。

原型尚未接入生产自动构建和部署。页脚提交号及索引时间是快照值；字体预览等内容也只是交互设计演示。后续改动原型后应同步更新 `snapshot.json` 的校验值与设计文档。
