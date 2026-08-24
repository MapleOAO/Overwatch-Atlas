# Overwatch Atlas 中文分支工程约定

## 基线与远端

本项目从 `upstream/main` 创建中文分支。`upstream` 只作为源项目的更新渠道，`origin` 只作为中文产品仓库；不从旧的废弃 `main` 分支复制代码、数据或提交历史。

```text
upstream/main ──同步──> cn-main ──发布──> origin
                         └─ zh-CN overlay
```

每次同步前必须在独立分支、干净工作区执行：

```bash
npm run sync:upstream:check
npm run sync:upstream
```

`sync-upstream.mjs` 会拒绝在 `main`/`master` 或脏工作区运行，并在合并后重新生成稳定 ID、中文覆盖层和质量检查结果。上游冲突只解决规范源文件；不要把 `src/data/locales/zh-CN` 当作上游文件覆盖。

## 中文数据层

- `src/data/*` 是上游英文规范数据，只增加稳定 `id`，不改动英文 `name`/`description`。
- `src/data/locales/zh-CN/content.json` 以 `kind:id` 保存覆盖翻译，并记录 `sourceHash`，上游记录变化会被检查器标记为 stale。
- `glossary.json` 保存术语、状态和来源；官方术语优先取中国区官网英雄页与首页。
- `ui.json` 保存界面静态标签；动态 DOM 由 `LocalizationService` 观察并翻译。
- `needs-review` 表示初稿，不能冒充国服官方译名；正式确认后才改为 `reviewed`。

常用检查：

```bash
npm run content:ids:check
npm run i18n:check
npm run i18n:official:check
npm run i18n:visible:check
# 完整翻译交付前再运行：
npm run i18n:check:strict
```

## 性能与素材

- 首屏不再预加载整套音乐、筛选缩略图和所有配色地球纹理。
- 筛选缩略图使用 `loading="lazy"` / `decoding="async"`；音乐只加载当前曲目。
- `scripts/_cache/` 是本地采集缓存，已从版本控制移除并永久忽略。
- GitHub Pages 构建只在 `_site` 将图片转为 WebP；源树保留 PNG/JPEG，方便从上游合并。
- 构建脚本会替换静态引用、注入版本标记并验证关键 JSON；本地开发不改变源素材。

