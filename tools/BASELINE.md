# 体育日报版式与交互基线（每日更新必须遵守）

本文件记录 2026-11-19 定型后的页面基线。每日更新只换内容，不得重写结构、样式与脚本；改动必须先改本文件并过闸门。

## 一、当前基线参数

- 布局：`.shell` 两列，侧栏 188px + 32px gap；`.side` 无 max-height、无内部滚动；日期 `.dates` 为 2 列 × 92px。
- 赛果看板：`.dash` 内两个 `.board`；`.sb` 双列网格，`max-height:320px; overflow-y:auto`；板高约 427px。
- 正文：`.prose` 最大宽 820px，字号 16.5px / 行高 1.72；条目 `.item` 内边距 18/20。
- 折叠规则：只对真正溢出正文的条目折叠。仅当 `scrollHeight - clientHeight >= 48` 时加 `.i-toggle`；`over < 48` 时必须移除 `.clamp` 并直接返回，短条目原样展示。全页 `.readbar` 仅当折叠条目 ≥3 才渲染。
- 章节：正文必须有 `h2#s1` 至 `h2#s6` 六个锚点，对应顶部六个 `.chip`（`data-sec='s1'...'s6'`）；`.prose h2{scroll-margin-top:76px}`，避免跳转后标题被吸顶条遮住。
- 主脚本（必须原样保留这两行，改一个字符都会让整段 `<script>` SyntaxError）：
  - `if(p)p.style.transform='scaleX('+(m>0?h.scrollTop/m:0)+')'}`
  - `addEventListener('scroll',paint,{passive:true});paint();`
- 侧栏卡片：`.stock-card` 恰好 2 个且不得嵌套；`#stk-lining`、`#mat-cost` 的 id 唯一（重复开标签会造成卡片套圈）。

## 二、每日更新固定流程

1. 从仓库最新 `index.html` 取骨架（不要凭记忆重建），只替换：报头日期与窗口、股票卡、期货 7 品种、赛果看板、发售日历、正文条目与公告卡。
2. 正文条目按章节顺序插入，章节标题 `h2#s1~s6`、chip 数量与 data-sec 不得改动；新增内容不得删除既有锚点。
3. 归档用 `tools/make_archive.py` 由当日 index 生成，保证首页与 `archive/YYYY-MM-DD.html` 一致。
4. 本地跑 `python3 tools/gate.py index.html archive/YYYY-MM-DD.html`，两个文件都必须 PASS；FAIL 禁止推送。
5. 推送后用线上页面做交互冒烟：六个 chip 逐一点击（落到对应标题、top≈76px）、阅读进度条随滚动变化、亮暗切换可用、短条目无「展开」按钮。
6. 任何结构、样式或脚本改动，先更新本文件，再改页面；禁止直接改线上 HTML 绕过闸门。

## 三、已知故障与防回归

- 2026-11-19：进度条脚本 `'scaleX('+(...)+')'` 少一个 `+`，整段脚本 SyntaxError，导致六个章节 chip 跳转、亮暗切换、回到顶部、进度条全部失效；同时 `s1~s5` 章节标题缺失。已修复并把「chip 与 h2 一一对应」「关键脚本片段存在」写入 `tools/gate.py` 断言。
- `addEventListener('scroll',paint(),...)` 传入的是 `paint()` 返回值而非函数，进度条会恒为 0；必须传 `paint`。
- `.stock-card` 重复开标签会造成双层圆角套圈，并把后续卡片吞进上一张卡；闸门已断言数量与唯一 id。

## 四、验收口径

- `tools/gate.py` 双 PASS（含 ASCII 双引号数量为 0）。
- 浏览器实测：chip 跳转、进度条、主题切换、折叠按钮数量符合「仅长文折叠」。
- 线上地址 `https://leo666-cloud.github.io/sports-daily/` 与归档地址内容一致。
