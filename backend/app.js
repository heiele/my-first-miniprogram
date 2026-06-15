// backend/app.js
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const { initDatabase } = require('./config/database')

// 导入路由
const taskRoutes = require('./routes/tasks')
const userRoutes = require('./routes/users')
const focusRoutes = require('./routes/focus')
const habitRoutes = require('./routes/habits')

const app = express()
const PORT = process.env.PORT || 3000

// 中间件
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// 请求日志
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
})

// 初始化数据库
initDatabase()

// 路由
app.use('/api/tasks', taskRoutes)
app.use('/api/users', userRoutes)
app.use('/api/focus', focusRoutes)
app.use('/api/habits', habitRoutes)

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 根路由
app.get('/', (req, res) => {
  res.json({
    name: '学习日历小程序后端',
    version: '1.0.0',
    endpoints: {
      tasks: '/api/tasks',
      users: '/api/users',
      focus: '/api/focus',
      habits: '/api/habits'
    }
  })
})

// 错误处理
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({ error: err.message })
})

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`)
  console.log(`📝 API 文档: http://localhost:${PORT}/`)
})
