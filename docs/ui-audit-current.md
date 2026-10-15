# 小日常私人版 Current UI 审计底稿

基线：`v0.2.0-before-ui-plugin`

分支：`ui/figma-audit`

这份文档服务于 Figma 的 Current UI 建模和后续 Design System，不改变产品功能，也不作为新版视觉稿。

## 页面和入口

| 页面 | 路径 | 主要任务 |
| --- | --- | --- |
| 今日打卡 | `/today` | 查看当天习惯、完成打卡、记录量化数量 |
| 打卡管理 | `/habits` | 按情景筛选、启用/停用、进入习惯详情 |
| 习惯详情 | `/habits/:id` | 查看统计、日历、量化趋势和更多信息 |
| 编辑习惯 | `/habits/:id/edit` | 编辑图标、颜色、场景、循环、提醒和量化 |
| 打卡表 | `/history` | 日、周、月、年查看完成记录 |
| 便利贴首页 | `/stickies` | 工作、生活、灵感、生日四类内容总览 |
| 工作项目 | `/stickies/work` | 查看项目、当前节点和完成状态 |
| 项目详情 | `/stickies/projects/:id` | 编辑客户、备注、节点和时间线 |
| 生活/灵感/生日清单 | `/stickies/life`、`/stickies/memos`、`/stickies/birthdays` | 查看和编辑对应内容 |
| 我的 | `/me` | 数据导出、导入、主题和 PWA 设置 |

## 当前做得好的地方

- 本地数据结构已经覆盖习惯、打卡、量化、项目、节点、生活事项、灵感和生日。
- 页面路由和功能边界已经明确，适合在不改业务逻辑的前提下做视觉重构。
- 习惯详情已经有统计、月历和趋势三个层次，后续可以直接统一组件样式。
- 便利贴已经有完成、恢复和撤回机制，符合“快速记录但避免误操作”的目标。
- 页面切换会回到顶部，适合手机端使用。

## 当前最影响质感的问题

### 高优先级

1. 不同页面的卡片、表单、分段控件仍有多套圆角、边框和背景定义。
2. 习惯详情、历史打卡表和今日首页的统计语言还没有完全统一。
3. 便利贴纸张样式已有方向，但首页、清单和项目详情的纸张层级还不完全一致。
4. 部分页面信息密度不稳定：有些区域留白过大，有些区域文本和按钮挤在一起。
5. iPhone Safari 的小屏宽度、横向滚动区域和安全区需要在 Figma 中明确标注。

### 中优先级

6. 习惯编辑页的循环、提醒、量化模块需要统一为同一种表单语言。
7. 图标目前以系统 Emoji 为主，不同设备的 Emoji 视觉会有差异。
8. 已完成、禁用、空状态和无量化数据状态还需要统一视觉规范。
9. 工作项目和生活事项虽然逻辑不同，但列表行的完成反馈应共享同一个基础组件。
10. 页面标题、辅助说明和次级文字的字号层级仍需要收敛。

## 第一版设计系统建议

### 颜色

只保留这些语义颜色：

- `background`：应用背景
- `surface`：卡片和便签纸
- `surface-secondary`：输入框、次级区域
- `text-primary`
- `text-secondary`
- `text-tertiary`
- `border`
- `divider`
- `accent`
- `success`
- `warning`
- `danger`

便利贴四类使用统一的纸张底色，只使用标题颜色区分类型，不再为每个区域使用一套强背景色。

### 间距

建议只使用：`4 / 8 / 12 / 16 / 20 / 24 / 32`。

### 圆角

建议只使用：`8 / 12 / 16 / 999`。

其中 `999` 只用于胶囊控件、圆形按钮和开关。

### 文字层级

- 页面标题
- 区域标题
- 主要内容
- 正文
- 辅助说明
- 元数据
- 按钮文字

## 需要在 Figma 中建立的组件

- AppShell
- BottomNavigation 和 NavItem
- PageHeader
- HabitItem：默认、完成、停用、带量化
- StickyQuadrant
- StickyRow
- CompletedRow
- PrimaryButton、SecondaryButton、IconButton
- Toggle
- SegmentedControl
- Sheet 和 Dialog
- FormRow
- CalendarDay
- TrendChart
- EmptyState
- UndoNotice

## 必须建模的状态

- 首次打开且没有数据
- 正在加载
- 有待完成习惯
- 全部完成
- 习惯被停用
- 量化已开启但暂无记录
- 量化已有记录
- 工作项目有节点和无节点
- 项目已完成
- 生活事项完成、恢复和撤回
- 灵感速记长文本
- 生日有公历和农历
- 375px 和 390px 手机宽度

## Figma 设计验收标准

- 页面不能横向溢出。
- 重要点击目标不小于约 44px。
- 底部导航不遮挡内容和安全区。
- 设计组件能映射到现有 React 组件，而不是生成整页图片。
- Figma 变量名称和代码 CSS 变量保持一致。
- 不修改数据库、路由和现有业务逻辑。

## 下一步

1. 在 Figma 建立 `00 Foundations`、`01 Current`、`02 Audit`、`03 Exploration`、`04 Redesign V1`、`05 Components`、`06 Prototype` 页面。
2. 先还原 Today、Habits、Habit Detail、Habit Form、Sticky Home 五个核心页面。
3. 只做 UI/UX Audit，不改代码。
4. 根据审计结果建立变量和组件。
5. 做两个视觉方向，选择一个后再扩展到其他页面。
