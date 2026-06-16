const express = require('express')
const router = express.Router()
const { db, initDatabase } = require('../config/database')
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
    let tasks = db.tasks || []
    tasks = tasks.filter(t => t.user_id === userId)
    tasks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    const result = tasks.map(t => ({
      ...t,
      subtasks: (db.subtasks || []).filter(s => s.task_id === t.id).map(s => ({ ...s, completed: s.completed === 1 })),
      completed: t.completed === 1
    }))

    res.json({ success: true, data: result })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/today', async (req, res) => {
  try {
    const userId = req.query.userId || 'default'
    const today = new Date().toISOString().split('T')[0]
    
    let tasks = db.tasks || []
    tasks = tasks.filter(t => t.user_id === userId && t.date === today)
    tasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline))

    const result = tasks.map(t => ({
      ...t,
      subtasks: (db.subtasks || []).filter(s => s.task_id === t.id).map(s => ({ ...s, completed: s.completed === 1 })),
      completed: t.completed === 1
    }))

    res.json({ success: true, data: result })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    let tasks = db.tasks || []
    const task = tasks.find(t => t.id === req.params.id)

    if (!task) {
      return res.status(404).json({ success: false, error: '任务不存在' })
    }

    const subtasks = (db.subtasks || []).filter(s => s.task_id === task.id).map(s => ({ ...s, completed: s.completed === 1 }))

    res.json({
      success: true,
      data: {
        ...task,
        subtasks,
        completed: task.completed === 1
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { userId = 'default', title, description, priority, deadline, date, interest, subtasks } = req.body
    
    if (!title) {
      return res.status(400).json({ success: false, error: '任务标题不能为空' })
    }

    const id = uuidv4()
    const now = new Date().toISOString()

    const newTask = {
      id,
      user_id: userId,
      title,
      description: description || '',
      priority: priority || 'medium',
      status: 'pending',
      deadline,
      date,
      interest: interest || 50,
      completed: 0,
      completed_at: null,
      created_at: now,
      updated_at: now
    }

    if (!db.tasks) db.tasks = []
    db.tasks.push(newTask)

    if (subtasks && subtasks.length > 0) {
      if (!db.subtasks) db.subtasks = []
      subtasks.forEach(st => {
        db.subtasks.push({
          id: uuidv4(),
          task_id: id,
          title: st.title,
          completed: st.completed ? 1 : 0,
          created_at: now
        })
      })
    }

    saveDatabase()
    res.json({ success: true, data: { id, ...req.body } })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { title, description, priority, deadline, date, interest, subtasks } = req.body
    const now = new Date().toISOString()

    let tasks = db.tasks || []
    const taskIndex = tasks.findIndex(t => t.id === req.params.id)
    
    if (taskIndex !== -1) {
      if (title !== undefined) tasks[taskIndex].title = title
      if (description !== undefined) tasks[taskIndex].description = description
      if (priority !== undefined) tasks[taskIndex].priority = priority
      if (deadline !== undefined) tasks[taskIndex].deadline = deadline
      if (date !== undefined) tasks[taskIndex].date = date
      if (interest !== undefined) tasks[taskIndex].interest = interest
      tasks[taskIndex].updated_at = now
    }

    if (subtasks !== undefined) {
      if (!db.subtasks) db.subtasks = []
      db.subtasks = db.subtasks.filter(s => s.task_id !== req.params.id)
      
      subtasks.forEach(st => {
        db.subtasks.push({
          id: st.id || uuidv4(),
          task_id: req.params.id,
          title: st.title,
          completed: st.completed ? 1 : 0,
          created_at: now
        })
      })
    }

    saveDatabase()
    res.json({ success: true, message: '任务更新成功' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/:id/complete', async (req, res) => {
  try {
    const now = new Date().toISOString()
    
    let tasks = db.tasks || []
    const taskIndex = tasks.findIndex(t => t.id === req.params.id)
    
    if (taskIndex !== -1) {
      tasks[taskIndex].completed = 1
      tasks[taskIndex].completed_at = now
      tasks[taskIndex].updated_at = now
    }

    saveDatabase()
    res.json({ success: true, message: '任务已完成' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    if (!db.subtasks) db.subtasks = []
    db.subtasks = db.subtasks.filter(s => s.task_id !== req.params.id)
    
    if (!db.tasks) db.tasks = []
    const originalLength = db.tasks.length
    db.tasks = db.tasks.filter(t => t.id !== req.params.id)
    const changes = originalLength - db.tasks.length
    
    saveDatabase()
    res.json({ success: true, message: '任务已删除' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.delete('/expired/batch', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const userId = req.body.userId || 'default'

    if (!db.tasks) db.tasks = []
    const originalLength = db.tasks.length
    db.tasks = db.tasks.filter(t => !(t.user_id === userId && t.date < today && t.completed === 0))
    const changes = originalLength - db.tasks.length

    saveDatabase()
    res.json({ success: true, message: `已删除 ${changes} 个过期任务` })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router