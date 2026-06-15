# 学习日历小程序后端

基于 Node.js + Express + SQLite 的后端服务。

## 快速开始

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 启动服务器

```bash
# 生产模式
npm start

# 开发模式（自动重启）
npm run dev
```

服务器将在 `http://localhost:3000` 启动。

### 3. 测试 API

访问 `http://localhost:3000/api/health` 检查服务状态。

## API 接口

### 任务管理 `/api/tasks`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/` | 获取所有任务 |
| GET | `/today` | 获取今日任务 |
| GET | `/:id` | 获取单个任务 |
| POST | `/` | 创建任务 |
| PUT | `/:id` | 更新任务 |
| PUT | `/:id/complete` | 完成任务 |
| DELETE | `/:id` | 删除任务 |

### 用户管理 `/api/users`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/:userId` | 获取用户信息 |
| PUT | `/:userId` | 更新用户信息 |
| GET | `/:userId/stats` | 获取统计数据 |
| GET | `/:userId/goal` | 获取学习目标 |
| POST | `/:userId/goal` | 保存学习目标 |
| POST | `/:userId/checkin` | 打卡 |

### 专注记录 `/api/focus`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/` | 获取专注记录 |
| GET | `/today` | 获取今日统计 |
| GET | `/weekly` | 获取周统计 |
| POST | `/` | 创建专注记录 |
| DELETE | `/:id` | 删除记录 |

### 习惯打卡 `/api/habits`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/` | 获取习惯列表 |
| POST | `/` | 创建习惯 |
| GET | `/:habitId/checkins` | 获取打卡记录 |
| POST | `/:habitId/checkin` | 打卡 |
| DELETE | `/:habitId` | 删除习惯 |

## 数据库

使用 SQLite 数据库，数据文件位于 `backend/data/miniapp.db`。

## 小程序配置

在小程序中使用时，需要修改 `utils/api.js` 中的 `BASE_URL`：

```javascript
// 开发环境
const BASE_URL = 'http://localhost:3000/api'

// 生产环境（需要部署到服务器）
const BASE_URL = 'https://your-domain.com/api'
```

**注意**：小程序需要在小程序管理后台配置服务器域名白名单。

## 部署

### 本地运行
```bash
npm start
```

### 服务器部署
1. 安装 Node.js 环境
2. 上传代码到服务器
3. 安装依赖：`npm install --production`
4. 使用 PM2 管理进程：
   ```bash
   npm install -g pm2
   pm2 start app.js --name miniapp-backend
   ```
