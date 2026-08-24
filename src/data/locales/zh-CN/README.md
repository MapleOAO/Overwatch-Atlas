# zh-CN overlay

`content.json`（含事件标题、实体和新闻标题）、`glossary.json` 和 `ui.json` 由 `npm run i18n:build` 从当前
`upstream/main` 的规范数据生成。不要直接改生成文件：

1. 在 `scripts/build-cn-overlay.mjs` 中补充经核对的国服译名或界面词条；
2. 运行 `npm run i18n:build`；
3. 运行 `npm run i18n:check`、`npm run i18n:official:check` 和 `npm run i18n:visible:check`。

`reviewed` 仅用于已核对的官方词条；`needs-review` 是初稿，必须在官方页面、国服客户端或可信 Wiki 交叉确认后再提升状态。
