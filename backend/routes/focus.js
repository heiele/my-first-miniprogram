// backend/routes/focus.js
const express = require('express')
const router = express.Router()
const { db } = require('../config/database')
const { v4: uuidv4 } = require('uuid')

// 获取专注记录
router.get('/', (req, res) => {
  try {
    const userId = req.query.userId || 'default'
    const limit = parseInt(req.query.limit) || 50

    const records = db.prepare(`
      SELECT * FROM focus_records
      WHERE user_id = ?
      ORDER BY started_at DESC
      LIMIT ?
    `).all(userId, limit)

    res.json({ success: true, data: records })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// 获取今日专注统计
router.get('/today', (req, res) => {
  try {
    const userId = req.query.userId || 'default'
    const today = new Date().toISOString().split('T')[0]

    const stats = db.prepare(`
      SELECT 
        COUNT(*) as session_count,
        COALESCE(SUM(duration), 0) as total_minutes
      FROM focus_records
      WHERE user_id = ? AND date(started_at) = ?
    `).get(userId, today)

    res.json({
      success: true,
      data: {
        sessionCount: stats.session_count || 0,
        totalMinutes: stats.total_minutes || 0
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// 获取周统计
router.get('/weekly', (req, res) => {
  try {
    const userId = req.query.userId || 'default'
    const today = new Date()
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay() + 1)

    const records = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]

      const stats = db.prepare(`
        SELECT COALESCE(SUM(duration), 0) as total_minutes
        FROM focus_records
        WHERE user_id = ? AND date(started_at) = ?
      `).get(userId, dateStr)

      records.push({
        date: dateStr,
        day: ['一', '二', '三', '四', '五', '六', '日'][i],
        minutes: stats.total_minutes || 0
      })
    }

    res.json({ success: true, data: records })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// 创建专注记录
router.post('/', (req, res) => {
  try {
    const { userId = 'default', duration, type, startedAt, endedAt } = req.body

    if (!duration) {
      return res.status(400).json({ success: false, error: '时长不能为空' })
    }

    const id = uuidv4()
    const now = new Date().toISOString()

    db.prepare(`
      INSERT INTO focus_records (id, user_id, duration, type, started_at, ended_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, duration, type || 'pomodoro', startedAt || now, endedAt || now, now)

    res.json({ success: true, data: { id, duration, type } })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// 删除专注记录
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM focus_records WHERE id = ?').run(req.params.id)
    res.json({ success: true, message: '记录已删除' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router
