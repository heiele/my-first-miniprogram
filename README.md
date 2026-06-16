# 学习日历小程序

一个帮助用户管理学习任务、记录专注时间、养成良好学习习惯的微信小程序。

## 项目简介

学习日历小程序集成了任务管理、日历视图、专注计时、习惯打卡等功能，帮助用户更高效地规划学习计划，追踪学习进度。

## 功能特性

### 📋 任务管理
- 创建、编辑、删除学习任务
- 任务分类与优先级设置
- 任务完成状态追踪
- 回收站功能，误删可恢复

### 📅 日历视图
- 月历展示学习计划
- 按日期查看任务
- 学习打卡记录展示

### ⏱️ 专注计时
- 番茄钟计时功能
- 专注时长统计
- 每日/每周专注数据可视化

### 👤 个人中心
- 用户信息管理
- 学习目标设置
- 学习数据统计
- 习惯养成记录

## 项目结构

```
miniApp-practice/
├── pages/                  # 小程序页面
│   ├── auth/              # 授权登录页
│   ├── index/             # 首页
│   ├── calendar/          # 日历页
│   ├── task/              # 任务页
│   │   └── recycle/       # 回收站
│   ├── focus/             # 专注页
│   ├── mine/              # 我的页
│   └── logs/              # 日志页
├── images/                 # 图片资源
├── utils/                  # 工具函数
│   ├── api.js             # API 接口封装
│   └── util.js            # 通用工具函数
├── backend/                # 后端服务
│   ├── config/            # 配置文件
│   ├── routes/            # 路由模块
│   └── app.js             # 后端入口
├── app.js                  # 小程序入口
├── app.json                # 小程序配置
└── app.wxss                # 全局样式
```

## 快速开始

### 前置要求

- 微信开发者工具
- Node.js 16+
- npm 或 yarn

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd miniApp-practice
   ```

2. **安装后端依赖**
   ```bash
   cd backend
   npm install
   ```

3. **启动后端服务**
   ```bash
   # 开发模式
   npm run dev

   # 生产模式
   npm start
   ```
   后端服务将在 `http://localhost:3000` 启动。

4. **导入小程序项目**
   - 打开微信开发者工具
   - 选择"导入项目"
   - 选择项目根目录
   - 填写 AppID（可使用测试号）

5. **配置 API 地址**
   修改 `utils/api.js` 中的 `BASE_URL`：
   ```javascript
   const BASE_URL = 'http://localhost:3000/api'
   ```

## 技术栈

### 前端
- 微信小程序原生框架
- WXML + WXSS + JavaScript

### 后端
- Node.js
- Express
- SQLite (better-sqlite3)

## API 接口

详细 API 文档请查看 [backend/README.md](./backend/README.md)

### 主要接口

| 模块 | 路径 | 说明 |
|------|------|------|
| 任务 | `/api/tasks` | 任务增删改查 |
| 用户 | `/api/users` | 用户信息管理 |
| 专注 | `/api/focus` | 专注记录管理 |
| 习惯 | `/api/habits` | 习惯打卡管理 |

## 开发指南

### 代码规范

- 使用 ESLint 进行代码检查
- 遵循微信小程序开发规范
- 组件化开发，提高代码复用

### 目录规范

- `pages/` - 页面文件，每个页面包含 .js, .json, .wxml, .wxss 四个文件
- `utils/` - 工具函数和公共方法
- `images/` - 静态图片资源
- `backend/` - 后端服务代码

## 部署说明

### 小程序发布

1. 在微信开发者工具中点击"上传"
2. 在微信公众平台提交审核
3. 审核通过后发布

### 后端部署

详见 [backend/README.md](./backend/README.md) 部署章节

## 注意事项

1. 小程序开发需要配置服务器域名白名单
2. 本地开发时需在开发者工具中勾选"不校验合法域名"
3. 生产环境需使用 HTTPS 协议

## 许可证

MIT License
