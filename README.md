# sports-daily 渲染管线 v2

本仓库采用「**冻结模板 + 每日数据**」结构，避免每天手拼 45KB HTML 导致各类 bug。

## 文件分工

| 文件 | 性质 | 日常是否修改 |
|---|---|---|
| `template.html` | 冻结骨架：全部 CSS、JS（天气/股票/粒子/亮暗/筛选）、永久 DOM 结构 | **否**，只在版式改造时动 |
| `build.py` | 渲染器：读模板 + 数据 dict → 生成 index.html / archive，跑离线断言 | 否，只在加新组件时动 |
| `data/YYYY-MM-DD.json` | 当天新闻数据（标题/来源/简介/链接） | **每天只写这个** |
| `index.html` | build.py 产物 | 否，由脚本生成，不手改 |
| `archive/YYYY-MM-DD.html` | 同一天的归档副本（加 `<base href='../'>`） | 否，由脚本生成 |
| `style.css` / `history.js` | 外部静态资源 | 否 |

## 每天的工作流（agent 侧）

1. 检索过去 24h 体育新闻，构造一个 Python dict（结构见 `build.py:render()` docstring）；
2. 调用 `render(data)` 得到 HTML 字符串；
3. `assert_html(html)` 自动检查：div 配平、0 ASCII 双引号、必备组件计数、rpt-card href、公告四行结构；
4. 断言全过后用 MCP `push_files` 一次推 `index.html` + `archive/YYYY-MM-DD.html`；
5. 等 90 秒，curl 双路径验证（HTTP 200、size≥30KB、grep 关键 class）。

## 为什么这样不会再出「天气 bug 那 bug」

- 天气 JS、股票 JS、粒子 canvas、亮暗切换、筛选按钮、rpt-card、dash 布局这些**永久代码只存在于 template.html**，每天的渲染是 `str.replace('{{PLACEHOLDER}}', 数据)`，手根本碰不到这些行；
- 笔误只能发生在数据 dict 里（纯文本标题/简介），不可能改坏 JS 逻辑；
- 离线断言在 push 前就挡住结构错误，不会带病上线。

## 占位符清单

`{{TITLE}}` `{{REPORT_STAMP}}` `{{DATE_SHORT}}` `{{WINDOW}}` `{{COUNT}}`
`{{HISTORY_COUNT}}` `{{HISTORY_DATES}}`
`{{TICKER_LEFT}}` `{{TICKER_RIGHT}}`
`{{SB_COUNT}}` `{{SB_ITEMS}}` `{{PM_COUNT}}` `{{PM_ITEMS}}`
`{{CORE_POINTS}}`
`{{ITEMS_A}}` `{{ITEMS_B}}` `{{ITEMS_C}}` `{{ITEMS_D}}`
`{{ANNOUNCEMENT}}` `{{HEAD_EXTRA}}`（archive 模式注入 `<base href='../'>`）
