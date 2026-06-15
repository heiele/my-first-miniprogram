// backend/routes/habits.js
const express = require('express')
const router = express.Router()
const { db } = require('../config/database')
const { v4: uuidv4 } = require('uuid')

// 获取用户习惯列表
router.get('/', (req, res) => {
  try {
    const userId = req.query.userId || 'default'

    const habits = db.prepare(`
      SELECT h.*,
        (SELECT COUNT(*) FROM habit_checkins WHERE habit_id = h.id) as total_checkins
      FROM habits h
      WHERE h.user_id = ?
      ORDER BY h.created_at DESC
    `).all(userId)

    res.json({ success: true, data: habits })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// 创建习惯
router.post('/', (req, res) => {
  try {
    const { userId = 'default', name, icon, description, targetDays } = req.body

    if (!name) {
      return res.status(400).json({ success: false, error: '习惯名称不能为空' })
    }

    const id = uuidv4()
    const now = new Date().toISOString()

    db.prepare(`
      INSERT INTO habits (id, user_id, name, icon, description, target_days, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, name, icon || '📝', description || '', targetDays || 21, now)

    res.json({ success: true, data: { id, name, icon, streak: 0 } })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// 获取习惯打卡记录
router.get('/:habitId/checkins', (req, res) => {
  try {
    const checkins = db.prepare(`
      SELECT checkin_date FROM habit_checkins
      WHERE habit_id = ?
      ORDER BY checkin_date DESC
    `).all(req.params.habitId)

    res.json({ success: true, data: checkins.map(c => c.checkin_date) })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// 打卡
router.post('/:habitId/checkin', (req, res) => {
  try {
    const habitId = req.params.habitId
    const { userId = 'default' } = req.body
    const today = new Date().toISOString().split('T')[0]

    // 检查是否已打卡
    const existing = db.prepare(`
      SELECT id FROM habit_checkins 
      WHERE habit_id = ? AND checkin_date = ?
    `).get(habitId, today)

    if (existing) {
      return res.json({ success: true, message: '今日已打卡', alreadyCheckedIn: true })
    }

    // 打卡
    db.prepare(`
      INSERT INTO habit_checkins (id, habit_id, user_id, checkin_date)
      VALUES (?, ?, ?, ?)
    `).run(uuidv4(), habitId, userId, today)

    // 更新连续天数
    const checkins = db.prepare(`
      SELECT checkin_date FROM habit_checkins
      WHERE habit_id = ?
      ORDER BY checkin_date DESC
    `).all(habitId)

    let streak = calculateStreak(checkins.map(c => c.checkin_date))
    db.prepare('UPDATE habits SET streak = ? WHERE id = ?').run(streak, habitId)

    res.json({ success: true, message: '打卡成功', streak, alreadyCheckedIn: false })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// 删除习惯
router.delete('/:habitId', (req, res) => {
  try {
    db.prepare('DELETE FROM habit_checkins WHERE habit_id = ?').run(req.params.habitId)
    db.prepare('DELETE FROM habits WHERE id = ?').run(req.params.habitId)
    
    res.json({ success: true, message: '习惯已删除' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// 计算连续打卡天数
function calculateStreak(checkins) {
  if (!checkins || checkins.length === 0) return 0

  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < checkins.length; i++) {
    const checkinDate = new Date(checkins[i])
    checkinDate.setHours(0, 0, 0, 0)
    
    const expectedDate = new Date(today)
    expectedDate.setDate(today.getDate() - i)

    if (checkinDate.getTime() === expectedDate.getTime()) {
      streak++
    } else {
      break
    }
  }

  return streak
}

module.exports = router
