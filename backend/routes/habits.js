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

router.get('/', async (req, res) => {
  try {
    const userId = req.query.userId || 'default'

    let habits = db.habits || []
    habits = habits.filter(h => h.user_id === userId)
    habits.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    const result = habits.map(h => {
      let checkins = db.habit_checkins || []
      const totalCheckins = checkins.filter(c => c.habit_id === h.id).length
      return { ...h, total_checkins: totalCheckins }
    })

    res.json({ success: true, data: result })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { userId = 'default', name, icon, description, targetDays } = req.body

    if (!name) {
      return res.status(400).json({ success: false, error: '习惯名称不能为空' })
    }

    const id = uuidv4()
    const now = new Date().toISOString()

    const newHabit = {
      id,
      user_id: userId,
      name,
      icon: icon || '📝',
      description: description || '',
      target_days: targetDays || 21,
      streak: 0,
      created_at: now
    }

    if (!db.habits) db.habits = []
    db.habits.push(newHabit)
    saveDatabase()

    res.json({ success: true, data: { id, name, icon, streak: 0 } })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/:habitId/checkins', async (req, res) => {
  try {
    let checkins = db.habit_checkins || []
    const habitCheckins = checkins
      .filter(c => c.habit_id === req.params.habitId)
      .map(c => c.checkin_date)
      .sort((a, b) => new Date(b) - new Date(a))

    res.json({ success: true, data: habitCheckins })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/:habitId/checkin', async (req, res) => {
  try {
    const habitId = req.params.habitId
    const { userId = 'default' } = req.body
    const today = new Date().toISOString().split('T')[0]

    let checkins = db.habit_checkins || []
    const existing = checkins.find(c => c.habit_id === habitId && c.checkin_date === today)

    if (existing) {
      return res.json({ success: true, message: '今日已打卡', alreadyCheckedIn: true })
    }

    checkins.push({
      id: uuidv4(),
      habit_id: habitId,
      user_id: userId,
      checkin_date: today,
      created_at: new Date().toISOString()
    })
    
    db.habit_checkins = checkins

    const habitCheckins = checkins
      .filter(c => c.habit_id === habitId)
      .map(c => c.checkin_date)
      .sort((a, b) => new Date(b) - new Date(a))

    let streak = calculateStreak(habitCheckins)
    
    let habits = db.habits || []
    const habitIndex = habits.findIndex(h => h.id === habitId)
    if (habitIndex !== -1) {
      habits[habitIndex].streak = streak
      db.habits = habits
    }

    saveDatabase()
    res.json({ success: true, message: '打卡成功', streak, alreadyCheckedIn: false })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.delete('/:habitId', async (req, res) => {
  try {
    if (!db.habit_checkins) db.habit_checkins = []
    db.habit_checkins = db.habit_checkins.filter(c => c.habit_id !== req.params.habitId)
    
    if (!db.habits) db.habits = []
    db.habits = db.habits.filter(h => h.id !== req.params.habitId)
    
    saveDatabase()
    res.json({ success: true, message: '习惯已删除' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

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