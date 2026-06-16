# 学习日历小程序后端

基于 Node.js + Express 的后端服务，使用 JSON 文件存储数据。

---

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

---

## API 接口

### 通用响应格式

**成功响应：**
```json
{
  "success": true,
  "data": { ... }
}
```

**失败响应：**
```json
{
  "success": false,
  "error": "错误信息"
}
```

---

### 任务管理 `/api/tasks`

#### GET /api/tasks
获取所有任务

**请求参数：**
| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| userId | String | 否 | default | 用户ID |

**响应示例：**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "default",
      "title": "任务标题",
      "description": "任务描述",
      "priority": "high",
      "status": "pending",
      "deadline": "2026-06-16 23:59",
      "date": "2026-06-16",
      "interest": 50,
      "completed": false,
      "completed_at": null,
      "created_at": "2026-06-16T08:00:00.000Z",
      "updated_at": "2026-06-16T08:00:00.000Z",
      "subtasks": []
    }
  ]
}
```

#### GET /api/tasks/today
获取今日任务

**请求参数：**
| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| userId | String | 否 | default | 用户ID |

**响应示例：**
同上

#### GET /api/tasks/:id
获取单个任务

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| id | String | 任务ID |

**响应示例：**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "任务标题",
    "completed": false,
    "subtasks": [
      { "id": "uuid", "title": "子任务1", "completed": false }
    ]
  }
}
```

#### POST /api/tasks
创建任务

**请求体：**
| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| userId | String | 否 | default | 用户ID |
| title | String | 是 | - | 任务标题 |
| description | String | 否 | "" | 任务描述 |
| priority | String | 否 | medium | 优先级（high/medium/low） |
| deadline | String | 是 | - | 截止时间（YYYY-MM-DD HH:mm） |
| date | String | 是 | - | 日期（YYYY-MM-DD） |
| interest | Number | 否 | 50 | 兴趣度（0-100） |
| subtasks | Array | 否 | [] | 子任务列表 |

**请求示例：**
```json
{
  "userId": "default",
  "title": "学习数学",
  "description": "完成第三章练习",
  "priority": "high",
  "deadline": "2026-06-16 23:59",
  "date": "2026-06-16",
  "interest": 80,
  "subtasks": [
    { "title": "习题1-5", "completed": false },
    { "title": "复习知识点", "completed": false }
  ]
}
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "学习数学",
    ...
  }
}
```

#### PUT /api/tasks/:id
更新任务

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| id | String | 任务ID |

**请求体：**
| 参数 | 类型 | 说明 |
|------|------|------|
| title | String | 任务标题 |
| description | String | 任务描述 |
| priority | String | 优先级 |
| deadline | String | 截止时间 |
| date | String | 日期 |
| interest | Number | 兴趣度 |
| subtasks | Array | 子任务列表 |

**响应示例：**
```json
{
  "success": true,
  "message": "任务更新成功"
}
```

#### PUT /api/tasks/:id/complete
完成任务

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| id | String | 任务ID |

**响应示例：**
```json
{
  "success": true,
  "message": "任务已完成"
}
```

#### DELETE /api/tasks/:id
删除任务

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| id | String | 任务ID |

**响应示例：**
```json
{
  "success": true,
  "message": "任务已删除"
}
```

#### DELETE /api/tasks/expired/batch
批量删除过期任务

**请求体：**
| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| userId | String | 否 | default | 用户ID |

**响应示例：**
```json
{
  "success": true,
  "message": "已删除 3 个过期任务"
}
```

---

### 用户管理 `/api/users`

#### GET /api/users/:userId
获取用户信息

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| userId | String | 用户ID |

**响应示例：**
```json
{
  "success": true,
  "data": {
    "id": "default",
    "nickname": "同学",
    "avatar_url": "",
    "signature": "",
    "theme": "light"
  }
}
```

#### PUT /api/users/:userId
更新用户信息

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| userId | String | 用户ID |

**请求体：**
| 参数 | 类型 | 说明 |
|------|------|------|
| nickname | String | 昵称 |
| avatar_url | String | 头像URL |
| signature | String | 个性签名 |
| theme | String | 主题（light/dark） |

**响应示例：**
```json
{
  "success": true,
  "message": "用户信息更新成功"
}
```

#### GET /api/users/:userId/stats
获取统计数据

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| userId | String | 用户ID |

**响应示例：**
```json
{
  "success": true,
  "data": {
    "todayTasks": { "total": 5, "completed": 3 },
    "todayFocus": 120,
    "todayHabits": 2
  }
}
```

#### GET /api/users/:userId/goal
获取学习目标

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| userId | String | 用户ID |

**响应示例：**
```json
{
  "success": true,
  "data": {
    "dailyDuration": 180,
    "types": ["考试备考", "技能学习"],
    "deadline": "2026-12-31",
    "checkInRecords": ["2026-06-15", "2026-06-16"]
  }
}
```

#### POST /api/users/:userId/goal
保存学习目标

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| userId | String | 用户ID |

**请求体：**
| 参数 | 类型 | 说明 |
|------|------|------|
| dailyDuration | Number | 每日学习时长（分钟） |
| types | Array | 学习类型列表 |
| deadline | String | 截止日期 |

**响应示例：**
```json
{
  "success": true,
  "message": "学习目标保存成功"
}
```

#### POST /api/users/:userId/checkin
打卡

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| userId | String | 用户ID |

**响应示例：**
```json
{
  "success": true,
  "message": "打卡成功",
  "alreadyCheckedIn": false
}
```

---

### 专注记录 `/api/focus`

#### GET /api/focus
获取专注记录

**请求参数：**
| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| userId | String | 否 | default | 用户ID |
| limit | Number | 否 | 50 | 返回数量限制 |

**响应示例：**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "default",
      "duration": 25,
      "type": "pomodoro",
      "started_at": "2026-06-16T08:00:00.000Z",
      "ended_at": "2026-06-16T08:25:00.000Z",
      "created_at": "2026-06-16T08:25:00.000Z"
    }
  ]
}
```

#### GET /api/focus/today
获取今日统计

**请求参数：**
| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| userId | String | 否 | default | 用户ID |

**响应示例：**
```json
{
  "success": true,
  "data": {
    "sessionCount": 4,
    "totalMinutes": 100
  }
}
```

#### GET /api/focus/weekly
获取周统计

**请求参数：**
| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| userId | String | 否 | default | 用户ID |

**响应示例：**
```json
{
  "success": true,
  "data": [
    { "date": "2026-06-16", "day": "一", "minutes": 120 },
    { "date": "2026-06-17", "day": "二", "minutes": 90 }
  ]
}
```

#### POST /api/focus
创建专注记录

**请求体：**
| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| userId | String | 否 | default | 用户ID |
| duration | Number | 是 | - | 专注时长（分钟） |
| type | String | 否 | pomodoro | 类型 |
| startedAt | String | 否 | 当前时间 | 开始时间 |
| endedAt | String | 否 | 当前时间 | 结束时间 |

**响应示例：**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "duration": 25,
    "type": "pomodoro"
  }
}
```

#### DELETE /api/focus/:id
删除记录

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| id | String | 记录ID |

**响应示例：**
```json
{
  "success": true,
  "message": "记录已删除"
}
```

---

### 习惯打卡 `/api/habits`

#### GET /api/habits
获取习惯列表

**请求参数：**
| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| userId | String | 否 | default | 用户ID |

**响应示例：**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "default",
      "name": "早起学习",
      "icon": "🌅",
      "description": "每天早上6点起床学习",
      "target_days": 21,
      "streak": 7,
      "total_checkins": 7,
      "created_at": "2026-06-10T00:00:00.000Z"
    }
  ]
}
```

#### POST /api/habits
创建习惯

**请求体：**
| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| userId | String | 否 | default | 用户ID |
| name | String | 是 | - | 习惯名称 |
| icon | String | 否 | 📝 | 图标 |
| description | String | 否 | "" | 描述 |
| targetDays | Number | 否 | 21 | 目标天数 |

**响应示例：**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "早起学习",
    "icon": "🌅",
    "streak": 0
  }
}
```

#### GET /api/habits/:habitId/checkins
获取打卡记录

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| habitId | String | 习惯ID |

**响应示例：**
```json
{
  "success": true,
  "data": ["2026-06-10", "2026-06-11", "2026-06-12"]
}
```

#### POST /api/habits/:habitId/checkin
打卡

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| habitId | String | 习惯ID |

**请求体：**
| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| userId | String | 否 | default | 用户ID |

**响应示例：**
```json
{
  "success": true,
  "message": "打卡成功",
  "streak": 8,
  "alreadyCheckedIn": false
}
```

#### DELETE /api/habits/:habitId
删除习惯

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| habitId | String | 习惯ID |

**响应示例：**
```json
{
  "success": true,
  "message": "习惯已删除"
}
```

---

## 数据库

使用 JSON 文件存储，数据文件位于 `backend/data/miniapp.json`。

### 数据模型

#### users
| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 用户ID |
| openid | String | 微信OpenID |
| nickname | String | 昵称 |
| avatar_url | String | 头像URL |
| signature | String | 个性签名 |
| theme | String | 主题 |
| created_at | String | 创建时间 |
| updated_at | String | 更新时间 |

#### tasks
| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 任务ID |
| user_id | String | 用户ID |
| title | String | 任务标题 |
| description | String | 任务描述 |
| priority | String | 优先级 |
| status | String | 状态 |
| deadline | String | 截止时间 |
| date | String | 日期 |
| interest | Number | 兴趣度 |
| completed | Number | 是否完成（0/1） |
| completed_at | String | 完成时间 |
| created_at | String | 创建时间 |
| updated_at | String | 更新时间 |

#### subtasks
| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 子任务ID |
| task_id | String | 任务ID |
| title | String | 子任务标题 |
| completed | Number | 是否完成（0/1） |
| created_at | String | 创建时间 |

#### focus_records
| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 记录ID |
| user_id | String | 用户ID |
| duration | Number | 专注时长（分钟） |
| type | String | 类型 |
| started_at | String | 开始时间 |
| ended_at | String | 结束时间 |
| created_at | String | 创建时间 |

#### habits
| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 习惯ID |
| user_id | String | 用户ID |
| name | String | 习惯名称 |
| icon | String | 图标 |
| description | String | 描述 |
| target_days | Number | 目标天数 |
| streak | Number | 连续打卡天数 |
| created_at | String | 创建时间 |

#### habit_checkins
| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 记录ID |
| habit_id | String | 习惯ID |
| user_id | String | 用户ID |
| checkin_date | String | 打卡日期 |
| created_at | String | 创建时间 |

#### study_goals
| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 目标ID |
| user_id | String | 用户ID |
| daily_duration | Number | 每日学习时长（分钟） |
| types | String | 学习类型（JSON数组） |
| deadline | String | 截止日期 |
| created_at | String | 创建时间 |
| updated_at | String | 更新时间 |

#### goal_checkins
| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 记录ID |
| goal_id | String | 目标ID |
| user_id | String | 用户ID |
| checkin_date | String | 打卡日期 |
| created_at | String | 创建时间 |

---

## 小程序配置

在小程序中使用时，需要修改 `utils/api.js` 中的 `BASE_URL`：

```javascript
// 开发环境
const BASE_URL = 'http://localhost:3000/api'

// 生产环境（需要部署到服务器）
const BASE_URL = 'https://your-domain.com/api'
```

**注意**：小程序需要在小程序管理后台配置服务器域名白名单。

---

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

---

## 健康检查

```bash
curl http://localhost:3000/api/health
```

响应：
```json
{
  "status": "ok",
  "timestamp": "2026-06-16T08:00:00.000Z"
}
```