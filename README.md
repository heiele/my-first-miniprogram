# 学习日历小程序

一个帮助用户管理学习任务、记录专注时间、养成学习习惯的微信小程序。

## 项目简介

学习日历小程序集成了任务管理、日历视图、专注计时、习惯打卡等功能，帮助用户更高效地规划学习计划，追踪学习进度。

## 技术栈

### 前端
- 微信小程序原生框架
- WXML + WXSS + JavaScript

### 后端
- Node.js
- Express 4.18.2
- CORS 2.8.5
- body-parser 1.20.2
- uuid 9.0.0

## 本地开发环境搭建

### 前置要求
- Node.js 16+
- 微信开发者工具

### 后端启动步骤

```bash
# 1. 进入后端目录
cd backend

# 2. 安装依赖
npm install

# 3. 启动服务
npm run dev
```

后端服务将在 `http://localhost:3000` 启动，首次运行会自动创建 `backend/data/miniapp.json` 数据库文件。

### 微信开发者工具导入步骤

1. 打开微信开发者工具
2. 选择"导入项目"
3. 选择项目根目录 `miniApp-practice`
4. 填写 AppID（可使用测试号）
5. 点击"导入"

### 配置前端连接后端

修改 `project.config.json` 中的设置：

```json
{
  "setting": {
    "urlCheck": false
  }
}
```

修改 `utils/api.js` 中的 API 基础地址：

```javascript
const BASE_URL = 'http://localhost:3000/api'
```

## 项目结构说明

```
miniApp-practice/
├── pages/                  # 小程序页面
│   ├── auth/              # 授权登录页
│   ├── index/             # 首页（任务概览、专注统计）
│   ├── calendar/          # 日历页（月历视图）
│   ├── task/              # 任务页（任务管理）
│   │   └── recycle/       # 回收站
│   ├── focus/             # 专注页（番茄钟）
│   ├── mine/              # 我的页（个人中心）
│   └── logs/              # 日志页
├── images/                 # 图片资源（tab图标）
├── utils/                  # 工具函数
│   ├── api.js             # API 接口封装
│   └── util.js            # 通用工具函数
├── backend/                # 后端服务
│   ├── config/            # 配置文件（数据库）
│   ├── routes/            # 路由模块
│   ├── data/              # 数据存储（运行时生成）
│   └── app.js             # 后端入口
├── app.js                  # 小程序入口
├── app.json                # 小程序配置
└── app.wxss                # 全局样式
```

## API 文档

### 任务管理

```bash
# 获取今日任务
GET /api/tasks/today?userId=default

# 创建任务
POST /api/tasks
Body: { userId, title, description, priority, deadline, date, interest, subtasks }

# 更新任务
PUT /api/tasks/:id
Body: { title, description, priority, deadline, date, interest, subtasks }

# 完成任务
PUT /api/tasks/:id/complete

# 删除任务
DELETE /api/tasks/:id

# 批量删除过期任务
DELETE /api/tasks/expired/batch
Body: { userId }
```

### 用户管理

```bash
# 获取用户信息
GET /api/users/:userId

# 更新用户信息
PUT /api/users/:userId
Body: { nickname, avatar_url, signature, theme }

# 获取用户统计
GET /api/users/:userId/stats

# 获取学习目标
GET /api/users/:userId/goal

# 保存学习目标
POST /api/users/:userId/goal
Body: { dailyDuration, types, deadline }

# 学习打卡
POST /api/users/:userId/checkin
```

### 专注记录

```bash
# 获取专注记录
GET /api/focus?userId=default

# 创建专注记录
POST /api/focus
Body: { userId, duration, focusType }

# 删除专注记录
DELETE /api/focus/:id
```

### 习惯管理

```bash
# 获取习惯列表
GET /api/habits?userId=default

# 创建习惯
POST /api/habits
Body: { userId, title, frequency, targetDays }

# 习惯打卡
POST /api/habits/:habitId/checkin

# 删除习惯
DELETE /api/habits/:habitId
```

## 开发过程中的关键决策

1. **我们选择 JSON 文件存储而不是 SQLite，因为** 项目规模较小，JSON 文件更易于调试和迁移，且无需额外的数据库配置。

2. **我们选择微信小程序原生框架而不是 Taro，因为** 项目专注于微信平台，原生框架能提供更好的性能和更小的包体积。

3. **我们选择本地存储优先而不是完全依赖后端，因为** 小程序本地存储 API 简单易用，能提供更好的离线体验，后端作为数据同步的补充。

4. **我们选择 Express 而不是更复杂的框架，因为** 项目 API 简单，Express 轻量级且足够满足需求，降低学习成本。

5. **我们选择在 utils/api.js 中封装 API 而不是直接调用 wx.request，因为** 统一管理接口地址、错误处理和数据转换，便于后续维护和切换环境。

## 已知限制

1. **数据同步**：当前版本主要依赖本地存储，后端数据同步功能未完全实现，多设备间数据不同步。

2. **用户认证**：使用简单的 userId 机制，没有实现完整的微信登录和用户体系。

3. **数据持久化**：后端使用 JSON 文件存储，不适合高并发场景，生产环境建议使用真正的数据库。

4. **实时通知**：缺少任务提醒和专注提醒功能，需要集成微信订阅消息。

5. **数据备份**：没有实现数据导出和备份功能，用户数据丢失风险较高。

6. **第三方集成**：天气、名言等接口为模拟数据，未接入真实的第三方 API。

7. **统计分析**：数据可视化功能较为简单，缺少更深入的学习分析报告。

## 注意事项

1. 本地开发时需在微信开发者工具中勾选"不校验合法域名"
2. 生产环境需配置 HTTPS 和服务器域名白名单
3. 后端数据文件 `backend/data/miniapp.json` 在首次运行时自动创建
4. 修改后端代码后需重启服务（开发模式下会自动重启）