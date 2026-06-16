// pages/task/task.js
const app = getApp()
const { taskApi } = require('../../utils/api')

Page({
  data: {
    taskList: [],
    theme: 'light',
    priorityLabels: { high: '高', medium: '中', low: '低' },
    showModal: false,
    editingTask: null,
    expandedTask: null,
    sortBy: 'smart',
    formData: { title: '', description: '', priority: 'medium', date: '', time: '', interest: 50, subtasks: [] },
    todayDate: '',
    eisenhowerFilter: 'all',
    loading: false,
    loadingText: '加载中...',
    error: null,
    syncingIds: []
  },

  onLoad() {
    this.initPage()
  },
  
  async initPage() {
    try {
      const now = new Date()
      const today = this.formatDate(now)
      const theme = wx.getStorageSync('theme') || 'light'
      this.setData({ todayDate: today, theme })
      
      await this.loadTasks()
    } catch (e) {
      console.error('task page init error:', e)
      this.setData({ error: '页面初始化失败', loading: false })
    }
  },

  onShow() {
    const theme = wx.getStorageSync('theme') || 'light'
    this.setData({ theme })
    this.loadTasks()
  },

  formatDate(date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return y + '-' + m + '-' + d
  },

  processTask(task) {
    const now = new Date()
    const deadline = new Date((task.deadline || '').replace(' ', 'T'))
    const isOverdue = !task.completed && deadline < now && !isNaN(deadline.getTime())
    const completedSubtasks = task.subtasks ? task.subtasks.filter(s => s.completed).length : 0
    const score = this.calculateSmartScore(task, deadline, now)
    const eisenhowerCategory = this.getEisenhowerCategory(task, deadline, now)
    const countdown = this.calculateCountdown(deadline, now)
    return { ...task, isOverdue, completedSubtasks, score, eisenhowerCategory, countdown }
  },

  calculateSmartScore(task, deadline, now) {
    let score = 0
    
    if (isNaN(deadline.getTime())) {
      score += 30
    } else {
      const timeDiff = deadline - now
      const hoursLeft = timeDiff / (1000 * 60 * 60)
      
      if (hoursLeft < 0) {
        score += 100
      } else if (hoursLeft < 1) {
        score += 85
      } else if (hoursLeft < 6) {
        score += 70
      } else if (hoursLeft < 24) {
        score += 55
      } else if (hoursLeft < 48) {
        score += 40
      } else {
        score += Math.max(10, 30 - hoursLeft / 24)
      }
    }
    
    const priorityBonus = { high: 30, medium: 15, low: 0 }
    score += priorityBonus[task.priority] || 15
    
    const interest = task.interest || 50
    score += Math.round(interest / 10)
    
    const completedSubtasks = task.subtasks ? task.subtasks.filter(s => s.completed).length : 0
    const totalSubtasks = task.subtasks ? task.subtasks.length : 0
    if (totalSubtasks > 0) {
      const progress = completedSubtasks / totalSubtasks
      score += Math.round((1 - progress) * 15)
    }
    
    if (!task.completed) {
      score += 10
    }
    
    return Math.min(100, Math.max(0, Math.round(score)))
  },

  getEisenhowerCategory(task, deadline, now) {
    if (isNaN(deadline.getTime())) {
      const isImportant = task.priority === 'high' || (task.interest && task.interest > 70)
      return isImportant ? 'schedule' : 'eliminate'
    }
    
    const timeDiff = deadline - now
    const hoursLeft = timeDiff / (1000 * 60 * 60)
    const isUrgent = hoursLeft < 24 || task.priority === 'high'
    const isImportant = task.priority === 'high' || (task.interest && task.interest > 70)
    
    if (isUrgent && isImportant) return 'do'
    if (!isUrgent && isImportant) return 'schedule'
    if (isUrgent && !isImportant) return 'delegate'
    return 'eliminate'
  },

  calculateCountdown(deadline, now) {
    if (isNaN(deadline.getTime())) {
      return { text: '无截止时间', type: 'normal' }
    }
    
    const timeDiff = deadline - now
    if (timeDiff < 0) {
      const absDiff = Math.abs(timeDiff)
      const hours = Math.floor(absDiff / (1000 * 60 * 60))
      const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60))
      return { text: `已过期 ${hours}小时${minutes}分钟`, type: 'overdue' }
    }
    
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (days > 0) {
      return { text: `${days}天${hours}小时后`, type: 'normal' }
    } else if (hours > 0) {
      return { text: `${hours}小时${minutes}分钟后`, type: 'soon' }
    } else {
      return { text: `${minutes}分钟后`, type: 'urgent' }
    }
  },

  sortTasks(tasks) {
    const arr = [...tasks]
    const order = { high: 0, medium: 1, low: 2 }
    
    if (this.data.sortBy === 'smart') {
      arr.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1
        return b.score - a.score
      })
    } else if (this.data.sortBy === 'deadline') {
      arr.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1
        return new Date(a.deadline || '') - new Date(b.deadline || '')
      })
    } else if (this.data.sortBy === 'priority') {
      arr.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1
        return order[a.priority] - order[b.priority]
      })
    } else {
      arr.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1
        return (b.created_at || 0) - (a.created_at || 0)
      })
    }
    return arr
  },

  filterByEisenhower(tasks) {
    const filter = this.data.eisenhowerFilter
    if (filter === 'all') return tasks
    return tasks.filter(t => t.eisenhowerCategory === filter)
  },

  async loadTasks() {
    this.setData({ loading: true, loadingText: '加载任务中...', error: null })
    
    try {
      const serverTasks = await taskApi.getAll()
      
      let processed = serverTasks.map(t => this.processTask(t))
      processed = this.filterByEisenhower(processed)
      
      this.setData({ 
        taskList: this.sortTasks(processed),
        loading: false,
        error: null
      })
      
      wx.setStorageSync('taskList', serverTasks)
    } catch (err) {
      console.error('load tasks error:', err)
      const localTasks = wx.getStorageSync('taskList') || []
      const processed = localTasks.map(t => this.processTask(t))
      
      this.setData({ 
        taskList: this.sortTasks(this.filterByEisenhower(processed)),
        loading: false,
        error: '网络异常，显示本地数据'
      })
    }
  },

  changeEisenhowerFilter(e) {
    const filter = e.currentTarget.dataset.filter
    this.setData({ eisenhowerFilter: filter })
    this.loadTasks()
  },

  backToAll() {
    this.setData({ eisenhowerFilter: 'all' })
    this.loadTasks()
  },

  changeSort(e) {
    const sortBy = e.currentTarget.dataset.sort
    this.setData({ sortBy })
    this.loadTasks()
  },

  showAddModal() {
    const now = new Date()
    this.setData({
      showModal: true,
      editingTask: null,
      formData: {
        title: '',
        description: '',
        priority: 'medium',
        date: this.formatDate(now),
        time: '12:00',
        subtasks: []
      }
    })
  },

  closeModal() { this.setData({ showModal: false }) },
  preventClose() {},

  onInputChange(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['formData.' + field]: e.detail.value })
  },

  setPriority(e) {
    this.setData({ 'formData.priority': e.currentTarget.dataset.priority })
  },

  onDateChange(e) { this.setData({ 'formData.date': e.detail.value }) },
  onTimeChange(e) { this.setData({ 'formData.time': e.detail.value }) },

  addSubtask() {
    this.setData({ 'formData.subtasks': [...this.data.formData.subtasks, ''] })
  },

  removeSubtask(e) {
    const idx = e.currentTarget.dataset.index
    this.setData({ 'formData.subtasks': this.data.formData.subtasks.filter((_, i) => i !== idx) })
  },

  onSubtaskInput(e) {
    const idx = e.currentTarget.dataset.index
    const arr = [...this.data.formData.subtasks]
    arr[idx] = e.detail.value
    this.setData({ 'formData.subtasks': arr })
  },

  async saveTask() {
    const { title, date, time, priority, description, interest, subtasks } = this.data.formData
    if (!title.trim()) { wx.showToast({ title: '请输入任务名称', icon: 'none' }); return }
    if (!date || !time) { wx.showToast({ title: '请选择截止时间', icon: 'none' }); return }

    const deadline = date + ' ' + time
    const sts = subtasks.filter(s => s.trim()).map((t, i) => ({ id: Date.now() + i, title: t.trim(), completed: false }))

    const newTask = {
      title: title.trim(),
      description: description.trim(),
      priority,
      deadline,
      date,
      interest: parseInt(interest) || 50,
      completed: false,
      subtasks: sts
    }

    if (this.data.editingTask) {
      newTask.id = this.data.editingTask.id
      newTask.created_at = this.data.editingTask.created_at
    }

    this.setData({ loading: true, loadingText: '保存中...' })

    try {
      const result = this.data.editingTask 
        ? await taskApi.update(newTask.id, newTask)
        : await taskApi.create(newTask)

      wx.showToast({ title: this.data.editingTask ? '更新成功' : '添加成功', icon: 'success' })
      this.closeModal()
      await this.loadTasks()
    } catch (err) {
      console.error('save task error:', err)
      this.setData({ loading: false })
      wx.showToast({ title: '保存失败，请重试', icon: 'none' })
    }
  },

  async deleteTask(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除', 
      content: '确定要删除这个任务吗？',
      success: async (res) => {
        if (res.confirm) {
          this.setData({ loading: true, loadingText: '删除中...' })
          
          try {
            await taskApi.delete(id)
            
            wx.showToast({ title: '删除成功', icon: 'success' })
            await this.loadTasks()
          } catch (err) {
            console.error('delete task error:', err)
            this.setData({ loading: false })
            wx.showToast({ title: '删除失败，请重试', icon: 'none' })
          }
        }
      }
    })
  },

  toggleExpand(e) {
    const id = e.currentTarget.dataset.id
    this.setData({ expandedTask: this.data.expandedTask === id ? null : id })
  },

  async toggleComplete(e) {
    const id = e.currentTarget.dataset.id
    const task = this.data.taskList.find(t => t.id === id)
    if (!task) return

    const isCompleting = !task.completed
    const newCompleted = isCompleting

    const updatedTasks = this.data.taskList.map(t => 
      t.id === id ? { ...t, completed: newCompleted } : t
    )
    const processed = updatedTasks.map(t => this.processTask(t))
    
    this.setData({ 
      taskList: this.sortTasks(this.filterByEisenhower(processed)),
      syncingIds: [...this.data.syncingIds, id]
    })

    if (isCompleting) {
      this.recordTaskCompletion(task)
    }

    try {
      await taskApi.complete(id)
      
      this.setData({ syncingIds: this.data.syncingIds.filter(i => i !== id) })
      
      if (isCompleting) {
        let recycleBin = wx.getStorageSync('recycleBin') || []
        recycleBin.push({ ...task, completed: true, completedTime: Date.now(), completionDate: this.formatDate(new Date()) })
        wx.setStorageSync('recycleBin', recycleBin)
        
        await this.loadTasks()
      }
      
      wx.showToast({ title: isCompleting ? '已完成' : '已取消', icon: 'success' })
    } catch (err) {
      console.error('toggle complete error:', err)
      this.setData({ syncingIds: this.data.syncingIds.filter(i => i !== id) })
      
      const revertedTasks = this.data.taskList.map(t => 
        t.id === id ? { ...t, completed: !newCompleted } : t
      )
      this.setData({ taskList: this.sortTasks(this.filterByEisenhower(revertedTasks.map(t => this.processTask(t)))) })
      
      wx.showToast({ title: '操作失败，请重试', icon: 'none' })
    }
  },

  recordTaskCompletion(task) {
    const completionRecords = wx.getStorageSync('taskCompletionRecords') || []
    completionRecords.push({
      taskId: task.id,
      taskTitle: task.title,
      priority: task.priority,
      completionTime: Date.now(),
      date: this.formatDate(new Date()),
      estimatedMinutes: task.subtasks ? task.subtasks.length * 15 : 30
    })
    wx.setStorageSync('taskCompletionRecords', completionRecords)
  },

  async toggleSubtask(e) {
    const taskId = e.currentTarget.dataset.taskId
    const subId = e.currentTarget.dataset.subId
    
    let tasks = [...this.data.taskList]
    let updatedTask = null
    
    tasks = tasks.map(t => {
      if (t.id === taskId) {
        const updatedSubtasks = t.subtasks.map(s => s.id === subId ? { ...s, completed: !s.completed } : s)
        updatedTask = { ...t, subtasks: updatedSubtasks }
        return updatedTask
      }
      return t
    })
    
    this.setData({ 
      taskList: this.sortTasks(this.filterByEisenhower(tasks.map(t => this.processTask(t)))),
      syncingIds: [...this.data.syncingIds, taskId]
    })

    try {
      if (updatedTask) {
        await taskApi.update(taskId, { subtasks: updatedTask.subtasks })
      }
      this.setData({ syncingIds: this.data.syncingIds.filter(i => i !== taskId) })
    } catch (err) {
      console.error('toggle subtask error:', err)
      this.setData({ syncingIds: this.data.syncingIds.filter(i => i !== taskId) })
      await this.loadTasks()
      wx.showToast({ title: '操作失败，请重试', icon: 'none' })
    }
  },

  editTask(e) {
    const id = e.currentTarget.dataset.id
    const task = this.data.taskList.find(t => t.id === id)
    if (!task) return

    const deadlineParts = (task.deadline || '').split(' ')
    const date = deadlineParts[0] || this.formatDate(new Date())
    const time = deadlineParts[1] || '12:00'

    this.setData({
      showModal: true,
      editingTask: task,
      formData: {
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        date: date,
        time: time,
        interest: task.interest || 50,
        subtasks: task.subtasks ? task.subtasks.map(s => s.title) : []
      }
    })
  },

  onInterestChange(e) {
    this.setData({ 'formData.interest': parseInt(e.detail.value) })
  },

  goToRecycle() {
    wx.navigateTo({
      url: '/pages/task/recycle/recycle'
    })
  },

  refreshTasks() {
    this.loadTasks()
  }
})