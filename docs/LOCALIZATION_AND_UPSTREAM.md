# 中文版维护与上游同步

本分支是 `MapleOAO/Overwatch-Atlas` 的中文维护版本。原始英文 JSON 保持不改，中文译文单独存放在：

```text
src/data/locales/zh-CN/ui.json
src/data/locales/zh-CN/glossary.json
src/data/locales/zh-CN/content.json
```

## 本地维护译文

在仓库根目录启动开发服务器：

```bash
npm install
node src/server.js
```

打开 `http://localhost:8000/translations.html`。维护页支持事件、英雄、阵营、NPC、地点、界面文案和术语表；保存操作只写入上述 locale 文件，不会改写原始英文资料。`reviewed` 表示已人工审核，`draft` / `needs-review` 表示仍需复核。

没有运行本地服务器时，维护页仍可编辑，但会下载 JSON 文件；请把下载结果放回对应目录后提交。

## 远程仓库关系

`origin` 必须是自己的仓库，`upstream` 只用于读取 Diego 的原仓库：

```bash
git remote set-url origin https://github.com/MapleOAO/Overwatch-Atlas.git
git remote add upstream https://github.com/DiegoSolanoC/Overwatch-Atlas.git
git remote set-url --push upstream DISABLED
```

最后一条会阻止误把提交推送到原仓库。检查结果应类似：

```text
origin   ...MapleOAO/Overwatch-Atlas.git (fetch)
origin   ...MapleOAO/Overwatch-Atlas.git (push)
upstream ...DiegoSolanoC/Overwatch-Atlas.git (fetch)
upstream DISABLED (push)
```

## 同步上游

在 `cn-main` 或其他本地维护分支执行：

```bash
npm run sync:upstream:check
npm run sync:upstream
```

同步脚本会检查工作区是否干净，只从 `upstream/main` fetch，合并到当前本地分支，然后执行稳定 ID 校验、翻译覆盖报告和 Pages 构建。它不会自动修改 `main`，也不会向 `upstream` 推送。

如果出现合并冲突，解决冲突后重新运行校验；不要用上游文件覆盖 `src/data/locales/zh-CN/`。上游新增或修改内容会因为稳定 ID 和 `sourceHash` 被翻译检查报告出来，之后在维护页补译或复核即可。

## 校验命令

```bash
npm run content:ids:check
npm run i18n:check
npm run build:pages
```

普通 `i18n:check` 会报告尚未翻译的内容但不阻断同步，因为上游可能随时新增英文资料；发布前若要强制所有条目完成译文，可运行 `npm run i18n:check:strict`。
