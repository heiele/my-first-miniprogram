const express = require('express')
const router = express.Router()
const { db } = require('../config/database')
const { v4: uuidv4 } = require('uuid')

function saveDatabase() {
  const fs = require('fs')
  const path = require('path')
  const dbPath = path.join(__dirname, '../data/miniapp.json')
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2))
}

router.get('/:userId', async (req, res) => {
  try {
    let users = db.users || []
    let user = users.find(u => u.id === req.params.userId)
    
    if (!user) {
      const id = req.params.userId
      const now = new Date().toISOString()
      
      const newUser = {
        id,
        openid: '',
        nickname: '同学',
        avatar_url: '',
        signature: '',
        theme: 'light',
        created_at: now,
        updated_at: now
      }
      
      users.push(newUser)
      db.users = users
      saveDatabase()
      
      user = { id, nickname: '同学', avatar_url: '', signature: '', theme: 'light' }
    }

    res.json({ success: true, data: user })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/:userId', async (req, res) => {
  try {
    const { nickname, avatar_url, signature, theme } = req.body
    const now = new Date().toISOString()

    let users = db.users || []
    const userIndex = users.findIndex(u => u.id === req.params.userId)
    
    if (userIndex !== -1) {
      if (nickname !== undefined) users[userIndex].nickname = nickname
      if (avatar_url !== undefined) users[userIndex].avatar_url = avatar_url
      if (signature !== undefined) users[userIndex].signature = signature
      if (theme !== undefined) users[userIndex].theme = theme
      users[userIndex].updated_at = now
      db.users = users
      saveDatabase()
    }

    res.json({ success: true, message: '用户信息更新成功' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/:userId/stats', async (req, res) => {
  try {
    const userId = req.params.userId
    const today = new Date().toISOString().split('T')[0]

    let tasks = db.tasks || []
    const todayTasks = tasks.filter(t => t.user_id === userId && t.date === today)
    const total = todayTasks.length
    const completed = todayTasks.filter(t => t.completed === 1).length

    let focusRecords = db.focus_records || []
    const todayFocus = focusRecords
      .filter(r => r.user_id === userId && r.started_at && r.started_at.split('T')[0] === today)
      .reduce((sum, r) => sum + (r.duration || 0), 0)

    let habitCheckins = db.habit_checkins || []
    const todayHabits = habitCheckins.filter(h => h.user_id === userId && h.checkin_date === today).length

    res.json({
      success: true,
      data: {
        todayTasks: { total, completed },
        todayFocus: todayFocus || 0,
        todayHabits
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/:userId/goal', async (req, res) => {
  try {
    let goals = db.study_goals || []
    let goal = goals.find(g => g.user_id === req.params.userId)
    
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

    let checkins = db.goal_checkins || []
    const goalCheckins = checkins
      .filter(c => c.goal_id === goal.id)
      .map(c => c.checkin_date)
      .sort((a, b) => new Date(b) - new Date(a))

    res.json({
      success: true,
      data: {
        ...goal,
        types: goal.types ? JSON.parse(goal.types) : [],
        checkInRecords: goalCheckins
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/:userId/goal', async (req, res) => {
  try {
    const { dailyDuration, types, deadline } = req.body
    const userId = req.params.userId
    const now = new Date().toISOString()

    let goals = db.study_goals || []
    const goalIndex = goals.findIndex(g => g.user_id === userId)

    if (goalIndex !== -1) {
      if (dailyDuration !== undefined) goals[goalIndex].daily_duration = dailyDuration
      if (types !== undefined) goals[goalIndex].types = JSON.stringify(types)
      if (deadline !== undefined) goals[goalIndex].deadline = deadline
      goals[goalIndex].updated_at = now
    } else {
      const newGoal = {
        id: uuidv4(),
        user_id: userId,
        daily_duration: dailyDuration || 180,
        types: types ? JSON.stringify(types) : '[]',
        deadline: deadline || '',
        created_at: now,
        updated_at: now
      }
      goals.push(newGoal)
    }
    
    db.study_goals = goals
    saveDatabase()

    res.json({ success: true, message: '学习目标保存成功' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/:userId/checkin', async (req, res) => {
  try {
    const userId = req.params.userId
    const today = new Date().toISOString().split('T')[0]

    let goals = db.study_goals || []
    let goal = goals.find(g => g.user_id === userId)
    
    if (!goal) {
      const now = new Date().toISOString()
      const newGoal = {
        id: uuidv4(),
        user_id: userId,
        daily_duration: 180,
        types: '[]',
        deadline: '',
        created_at: now,
        updated_at: now
      }
      goals.push(newGoal)
      db.study_goals = goals
      goal = newGoal
    }

    let checkins = db.goal_checkins || []
    const existing = checkins.find(c => c.goal_id === goal.id && c.checkin_date === today)

    if (existing) {
      return res.json({ success: true, message: '今日已打卡', alreadyCheckedIn: true })
    }

    checkins.push({
      id: uuidv4(),
      goal_id: goal.id,
      user_id: userId,
      checkin_date: today,
      created_at: new Date().toISOString()
    })
    
    db.goal_checkins = checkins
    saveDatabase()

    res.json({ success: true, message: '打卡成功', alreadyCheckedIn: false })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router