// backend/routes/tasks.js
const express = require('express')
const router = express.Router()
const { db } = require('../config/database')
const { v4: uuidv4 } = require('uuid')

// 获取所有任务
router.get('/', (req, res) => {
  try {
    const userId = req.query.userId || 'default'
    const tasks = db.prepare(`
      SELECT t.*, 
        (SELECT json_group_array(json_object('id', id, 'title', title, 'completed', completed))
         FROM subtasks WHERE task_id = t.id) as subtasks
      FROM tasks t
      WHERE t.user_id = ?
      ORDER BY t.created_at DESC
    `).all(userId)

    const result = tasks.map(t => ({
      ...t,
      subtasks: t.subtasks ? JSON.parse(t.subtasks) : [],
      completed: t.completed === 1
    }))

    res.json({ success: true, data: result })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// 获取今日任务
router.get('/today', (req, res) => {
  try {
    const userId = req.query.userId || 'default'
    const today = new Date().toISOString().split('T')[0]
    
    const tasks = db.prepare(`
      SELECT t.*,
        (SELECT json_group_array(json_object('id', id, 'title', title, 'completed', completed))
         FROM subtasks WHERE task_id = t.id) as subtasks
      FROM tasks t
      WHERE t.user_id = ? AND t.date = ?
      ORDER BY t.deadline ASC
    `).all(userId, today)

    const result = tasks.map(t => ({
      ...t,
      subtasks: t.subtasks ? JSON.parse(t.subtasks) : [],
      completed: t.completed === 1
    }))

    res.json({ success: true, data: result })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// 获取单个任务
router.get('/:id', (req, res) => {
  try {
    const task = db.prepare(`
      SELECT t.*,
        (SELECT json_group_array(json_object('id', id, 'title', title, 'completed', completed))
         FROM subtasks WHERE task_id = t.id) as subtasks
      FROM tasks t
      WHERE t.id = ?
    `).get(req.params.id)

    if (!task) {
      return res.status(404).json({ success: false, error: '任务不存在' })
    }

    res.json({
      success: true,
      data: {
        ...task,
        subtasks: task.subtasks ? JSON.parse(task.subtasks) : [],
        completed: task.completed === 1
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// 创建任务
router.post('/', (req, res) => {
  try {
    const { userId = 'default', title, description, priority, deadline, date, interest, subtasks } = req.body
    
    if (!title) {
      return res.status(400).json({ success: false, error: '任务标题不能为空' })
    }

    const id = uuidv4()
    const now = new Date().toISOString()

    db.prepare(`
      INSERT INTO tasks (id, user_id, title, description, priority, deadline, date, interest, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, title, description || '', priority || 'medium', deadline, date, interest || 50, now, now)

    // 插入子任务
    if (subtasks && subtasks.length > 0) {
      const insertSubtask = db.prepare(`
        INSERT INTO subtasks (id, task_id, title, completed) VALUES (?, ?, ?, ?)
      `)
      
      subtasks.forEach(st => {
        insertSubtask.run(uuidv4(), id, st.title, st.completed ? 1 : 0)
      })
    }

    res.json({ success: true, data: { id, ...req.body } })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// 更新任务
router.put('/:id', (req, res) => {
  try {
    const { title, description, priority, deadline, date, interest, subtasks } = req.body
    const now = new Date().toISOString()

    db.prepare(`
      UPDATE tasks 
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          priority = COALESCE(?, priority),
          deadline = COALESCE(?, deadline),
          date = COALESCE(?, date),
          interest = COALESCE(?, interest),
          updated_at = ?
      WHERE id = ?
    `).run(title, description, priority, deadline, date, interest, now, req.params.id)

    // 更新子任务
    if (subtasks) {
      db.prepare('DELETE FROM subtasks WHERE task_id = ?').run(req.params.id)
      
      const insertSubtask = db.prepare(`
        INSERT INTO subtasks (id, task_id, title, completed) VALUES (?, ?, ?, ?)
      `)
      
      subtasks.forEach(st => {
        insertSubtask.run(st.id || uuidv4(), req.params.id, st.title, st.completed ? 1 : 0)
      })
    }

    res.json({ success: true, message: '任务更新成功' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// 完成任务
router.put('/:id/complete', (req, res) => {
  try {
    const now = new Date().toISOString()
    
    db.prepare(`
      UPDATE tasks SET completed = 1, completed_at = ?, updated_at = ? WHERE id = ?
    `).run(now, now, req.params.id)

    res.json({ success: true, message: '任务已完成' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// 删除任务
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM subtasks WHERE task_id = ?').run(req.params.id)
    db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id)
    
    res.json({ success: true, message: '任务已删除' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// 批量删除过期任务
router.delete('/expired/batch', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const userId = req.body.userId || 'default'

    const result = db.prepare(`
      DELETE FROM tasks 
      WHERE user_id = ? AND date < ? AND completed = 0
    `).run(userId, today)

    res.json({ success: true, message: `已删除 ${result.changes} 个过期任务` })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router
