# 项目结构（首版）

```text
.
├── public/                    # PWA 图标和静态资源
├── icons/                     # 应用图标源文件
├── src/
│   ├── app/                   # App 入口、路由、Provider、导航壳
│   ├── components/            # 跨页面通用 UI：卡片、按钮、模态框等
│   ├── features/
│   │   ├── today/             # 今日任务、场景分组、打卡交互
│   │   ├── history/           # 日／周／月／年历史视图和统计
│   │   ├── habits/            # 习惯列表、新建、编辑、删除
│   │   └── settings/          # 我的、主题、提醒、导入导出
│   ├── domain/                # Habit、CheckRecord、周期和统计纯函数
│   ├── db/                    # Dexie 数据库、表定义和数据库迁移
│   ├── services/              # 提醒、导入导出、PWA 相关服务
│   ├── lib/                   # 日期、校验、ID 等基础工具
│   └── styles/                # 全局样式、主题变量和 Tailwind 入口
├── tests/
│   ├── unit/                  # 周期、日期、统计、迁移测试
│   ├── component/             # React 组件和页面交互测试
│   └── e2e/                   # 创建习惯到完成打卡的关键流程
├── PRD.md
├── TECHNICAL_PLAN.md
└── PROJECT_STRUCTURE.md
```

约定：

- `features` 按用户功能组织，页面只组合功能模块。
- `domain` 不依赖 React、浏览器 API 或 IndexedDB，保证规则可独立测试。
- `db` 和 `services` 是基础设施层，业务组件通过 hooks 或 use-case 调用。
- 测试目录与实现层对应，优先覆盖会影响数据正确性的逻辑。

