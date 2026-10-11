# 小日常私人版技术方案 V1

## 1. 推荐技术栈

| 层 | 选择 | 原因 |
| --- | --- | --- |
| 应用框架 | React 19 + TypeScript | 适合四个页面和可复用的打卡组件，类型约束便于维护数据逻辑 |
| 构建工具 | Vite | 启动快、配置少、适合 PWA 和静态部署 |
| 路由 | React Router | 对应首页、打卡表、管理、我的四个页面 |
| UI 样式 | Tailwind CSS + 少量 CSS | 快速实现移动端优先布局、主题色和响应式卡片 |
| 全局状态 | Zustand | 管理当前日期、筛选条件、设置和 UI 状态；持久数据仍由数据库负责 |
| 本地数据库 | IndexedDB + Dexie | 浏览器原生持久化，支持结构化查询和离线使用，满足个人数据本地保存 |
| PWA | vite-plugin-pwa + Workbox | 生成 manifest 和 Service Worker，支持安装与静态资源离线缓存 |
| 测试 | Vitest、React Testing Library、Playwright | 分别覆盖规则计算、组件交互和关键用户流程 |
| 代码质量 | ESLint、Prettier | 统一 TypeScript/React 代码风格 |

不引入后端、账号体系或云数据库。首版数据留在用户设备，导出文件是跨设备迁移的主要方式。

## 2. 应用分层

```text
页面与组件（React）
        ↓
应用用例（创建习惯、打卡、统计、导入导出）
        ↓
领域逻辑（周期匹配、日期计算、统计）
        ↓
基础设施（Dexie、通知、文件导入导出）
```

页面不直接操作 IndexedDB。所有写入都经过 repository 或 use-case，方便测试、数据迁移和未来替换存储实现。

## 3. 数据设计

### Habit 表

```ts
type Habit = {
  id: string;
  name: string;
  icon: string;
  color: string;
  context: string;
  scheduleType: 'daily' | 'weeklyDays' | 'weeklyCount' | 'monthlyDate' | 'monthlyCount';
  scheduleConfig: Record<string, unknown>;
  reminderTime?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};
```

### CheckRecord 表

```ts
type CheckRecord = {
  id: string;
  habitId: string;
  date: string; // 用户本地自然日：YYYY-MM-DD
  completed: boolean;
  completedAt?: string;
};
```

### Settings 表

保存默认提醒时间、提醒开关、主题色和首页布局等设置。

数据库版本必须递增管理。导出文件带有 `schemaVersion`，导入时先校验格式，再执行迁移；无效文件不得覆盖现有数据。

## 4. 周期与统计规则

- 所有自然日计算使用浏览器本地时区，不使用 UTC 截日。
- 每个习惯在同一自然日最多有一条记录；重复点击只切换完成状态。
- `daily` 每天生成一个应完成日期。
- `weeklyDays` 只在配置的星期几生成应完成日期。
- `weeklyCount` 按用户本地周统计完成次数。
- `monthlyDate` 在每月配置日期生成应完成日期；不存在的日期按产品确认的规则处理，默认取当月最后一天。
- `monthlyCount` 按用户本地月份统计完成次数。
- 停用习惯停止生成未来任务，历史记录保留。

周期计算写成纯函数，使用固定输入输出测试边界日期、跨月和跨年情况。

## 5. 提醒实现

### V1 可实现范围

1. 用户授权通知后，应用打开时检查当天未完成事项。
2. 到达设置时间时，如果页面仍在运行，则通过 Notification API 提醒。
3. Service Worker 负责通知点击后打开应用和定位到今日页面。
4. 不支持通知或用户拒绝授权时，首页继续显示应用内提醒提示，不影响打卡。

### 平台限制与降级

浏览器和 iOS 对后台定时任务有限制，纯本地 PWA 无法保证应用完全关闭后仍能在任意时间触发通知。因此首版不承诺“关闭应用后必达”的本地提醒。iOS 后台可靠提醒需要 Web Push 和服务端，列入后续方案。

提醒调度封装在 `reminderService` 中，页面只调用统一接口，便于未来接入 Web Push。

## 6. PWA 与离线策略

- manifest 配置应用名称、图标、主题色和 `standalone` 显示模式。
- Service Worker 预缓存构建后的静态资源。
- 应用壳离线可打开，IndexedDB 数据离线可读写。
- 首版不缓存外部图片、第三方接口或敏感数据到网络缓存。
- 更新采用提示用户刷新，避免后台静默替换导致数据操作中断。

## 7. 导入导出

导出为 JSON 文件，包含：`schemaVersion`、导出时间、设置、习惯和打卡记录。导入流程：

1. 读取文件并校验 schema 版本和字段类型。
2. 在内存中完成迁移和去重预览。
3. 用户确认后以事务方式写入。
4. 写入失败时回滚，不破坏现有数据。

默认提供“合并导入”；覆盖现有数据需要单独的危险操作确认。

## 8. 路由与页面骨架

- `/`：今日打卡
- `/history`：打卡表
- `/habits`：打卡管理
- `/habits/new`：新建习惯
- `/habits/:id/edit`：编辑习惯
- `/me`：我的

底部导航只显示四个主路由；新建和编辑页面使用独立表单路由，并提供返回入口。

## 9. 测试策略

### 必须有的自动化测试

- 周期匹配和自然日边界。
- 打卡新增、取消和重复点击幂等性。
- 停用习惯不生成未来任务。
- 导出、导入校验和 schema 迁移。
- 首页创建习惯并完成一次打卡的端到端流程。

### 手工验收

- iPhone Safari 添加到主屏幕并离线打开。
- 桌面浏览器刷新和重启后数据仍在。
- 通知允许、拒绝和不支持三种状态。
- 窄屏与桌面宽度下四个主页面布局。

## 10. 实施顺序

1. 初始化 Vite、TypeScript、路由、样式和质量检查。
2. 建立 Dexie 数据库、类型和周期纯函数。
3. 完成习惯管理与首页打卡。
4. 完成历史周／月／年视图。
5. 完成设置、导入导出和 PWA。
6. 接入应用内提醒与可用范围内的浏览器通知。
7. 运行自动化测试和移动端手工验收。

## 11. 需要确认的实现取舍

- 是否接受“应用关闭时本地提醒不保证送达”的浏览器限制。
- 月度固定日期遇到当月不存在该日期时，是否采用当月最后一天。
- 导入默认采用合并还是覆盖；本方案默认合并。
- 首版是否保留首页“宫格”布局，还是统一采用按场景分组的卡片列表。

