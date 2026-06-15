// backend/routes/users.js
const express = require('express')
const router = express.Router()
const { db } = require('../config/database')
const { v4: uuidv4 } = require('uuid')

// 获取用户信息
router.get('/:userId', (req, res) => {
  try {
    let user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.userId)
    
    if (!user) {
      // 创建默认用户
      const id = req.params.userId
      const now = new Date().toISOString()
      
      db.prepare(`
        INSERT INTO users (id, nickname, created_at, updated_at)
        VALUES (?, '同学', ?, ?)
      `).run(id, now, now)
      
      user = { id, nickname: '同学', avatar_url: '', signature: '', theme: 'light' }
    }

    res.json({ success: true, data: user })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// 更新用户信息
router.put('/:userId', (req, res) => {
  try {
    const { nickname, avatar_url, signature, theme } = req.body
    const now = new Date().toISOString()

    db.prepare(`
      UPDATE users 
      SET nickname = COALESCE(?, nickname),
          avatar_url = COALESCE(?, avatar_url),
          signature = COALESCE(?, signature),
          theme = COALESCE(?, theme),
          updated_at = ?
      WHERE id = ?
    `).run(nickname, avatar_url, signature, theme, now, req.params.userId)

    res.json({ success: true, message: '用户信息更新成功' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// 获取用户统计数据
router.get('/:userId/stats', (req, res) => {
  try {
    const userId = req.params.userId
    const today = new Date().toISOString().split('T')[0]

    // 今日任务统计
    const todayStats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed
      FROM tasks
      WHERE user_id = ? AND date = ?
    `).get(userId, today)

    // 专注时长统计
    const focusStats = db.prepare(`
      SELECT COALESCE(SUM(duration), 0) as total_minutes
      FROM focus_records
      WHERE user_id = ? AND date(started_at) = ?
    `).get(userId, today)

    // 习惯打卡统计
    const habitStats = db.prepare(`
      SELECT COUNT(*) as checked_in
      FROM habit_checkins
      WHERE user_id = ? AND checkin_date = ?
    `).get(userId, today)

    res.json({
      success: true,
      data: {
        todayTasks: {
          total: todayStats.total || 0,
          completed: todayStats.completed || 0
        },
        todayFocus: focusStats.total_minutes || 0,
        todayHabits: habitStats.checked_in || 0
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// 获取用户学习目标
router.get('/:userId/goal', (req, res) => {
  try {
    let goal = db.prepare('SELECT * FROM study_goals WHERE user_id = ?').get(req.params.userId)
    
    if (!goal) {
      res.json({
        success: true,
        data: {
          dailyDuration: 180,
          types: [],
          deadline: '',
          checkInRecords: []
        }
      })
      return
    }

    // 获取打卡记录
    const checkins = db.prepare(`
      SELECT checkin_date FROM goal_checkins 
      WHERE goal_id = ? ORDER BY checkin_date DESC
    `).all(goal.id)

    res.json({
      success: true,
      data: {
        ...goal,
        types: goal.types ? JSON.parse(goal.types) : [],
        checkInRecords: checkins.map(c => c.checkin_date)
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// 保存用户学习目标
router.post('/:userId/goal', (req, res) => {
  try {
    const { dailyDuration, types, deadline } = req.body
    const userId = req.params.userId
    const now = new Date().toISOString()

    let goal = db.prepare('SELECT id FROM study_goals WHERE user_id = ?').get(userId)

    if (goal) {
      db.prepare(`
        UPDATE study_goals 
        SET daily_duration = ?, types = ?, deadline = ?, updated_at = ?
        WHERE user_id = ?
      `).run(dailyDuration, JSON.stringify(types), deadline, now, userId)
    } else {
      const id = uuidv4()
      db.prepare(`
        INSERT INTO study_goals (id, user_id, daily_duration, types, deadline, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, userId, dailyDuration, JSON.stringify(types), deadline, now, now)
    }

    res.json({ success: true, message: '学习目标保存成功' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// 打卡
router.post('/:userId/checkin', (req, res) => {
  try {
    const userId = req.params.userId
    const today = new Date().toISOString().split('T')[0]

    let goal = db.prepare('SELECT id FROM study_goals WHERE user_id = ?').get(userId)
    
    if (!goal) {
      // 创建默认目标
      const id = uuidv4()
      const now = new Date().toISOString()
      db.prepare(`
        INSERT INTO study_goals (id, user_id, created_at, updated_at)
        VALUES (?, ?, ?, ?)
      `).run(id, userId, now, now)
      goal = { id }
    }

    // 检查是否已打卡
    const existing = db.prepare(`
      SELECT id FROM goal_checkins 
      WHERE goal_id = ? AND checkin_date = ?
    `).get(goal.id, today)

    if (existing) {
      return res.json({ success: true, message: '今日已打卡', alreadyCheckedIn: true })
    }

    // 打卡
    db.prepare(`
      INSERT INTO goal_checkins (id, goal_id, user_id, checkin_date)
      VALUES (?, ?, ?, ?)
    `).run(uuidv4(), goal.id, userId, today)

    res.json({ success: true, message: '打卡成功', alreadyCheckedIn: false })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router
