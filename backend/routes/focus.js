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
    const limit = parseInt(req.query.limit) || 50

    let records = db.focus_records || []
    records = records.filter(r => r.user_id === userId)
    records.sort((a, b) => new Date(b.started_at) - new Date(a.started_at))
    records = records.slice(0, limit)

    res.json({ success: true, data: records })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/today', async (req, res) => {
  try {
    const userId = req.query.userId || 'default'
    const today = new Date().toISOString().split('T')[0]

    let records = db.focus_records || []
    const todayRecords = records.filter(r => 
      r.user_id === userId && r.started_at && r.started_at.split('T')[0] === today
    )
    
    const sessionCount = todayRecords.length
    const totalMinutes = todayRecords.reduce((sum, r) => sum + (r.duration || 0), 0)

    res.json({
      success: true,
      data: {
        sessionCount,
        totalMinutes
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/weekly', async (req, res) => {
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

      let focusRecords = db.focus_records || []
      const dayRecords = focusRecords.filter(r => 
        r.user_id === userId && r.started_at && r.started_at.split('T')[0] === dateStr
      )
      const minutes = dayRecords.reduce((sum, r) => sum + (r.duration || 0), 0)

      records.push({
        date: dateStr,
        day: ['一', '二', '三', '四', '五', '六', '日'][i],
        minutes
      })
    }

    res.json({ success: true, data: records })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { userId = 'default', duration, type, startedAt, endedAt } = req.body

    if (!duration) {
      return res.status(400).json({ success: false, error: '时长不能为空' })
    }

    const id = uuidv4()
    const now = new Date().toISOString()

    const newRecord = {
      id,
      user_id: userId,
      duration,
      type: type || 'pomodoro',
      started_at: startedAt || now,
      ended_at: endedAt || now,
      created_at: now
    }

    if (!db.focus_records) db.focus_records = []
    db.focus_records.push(newRecord)
    saveDatabase()

    res.json({ success: true, data: { id, duration, type } })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    if (!db.focus_records) db.focus_records = []
    db.focus_records = db.focus_records.filter(r => r.id !== req.params.id)
    saveDatabase()
    
    res.json({ success: true, message: '记录已删除' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router