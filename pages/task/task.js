// pages/task/task.js
const app = getApp()

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
    eisenhowerFilter: 'all'
  },

  onLoad() {
    const now = new Date()
    const today = this.formatDate(now)
    const theme = wx.getStorageSync('theme') || 'light'
    this.setData({ todayDate: today, theme })
    this.loadTasks()
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
    const deadline = new Date(task.deadline.replace(' ', 'T'))
    const isOverdue = !task.completed && deadline < now
    const completedSubtasks = task.subtasks ? task.subtasks.filter(s => s.completed).length : 0
    const score = this.calculateSmartScore(task, deadline, now)
    const eisenhowerCategory = this.getEisenhowerCategory(task, deadline, now)
    const countdown = this.calculateCountdown(deadline, now)
    return { ...task, isOverdue, completedSubtasks, score, eisenhowerCategory, countdown }
  },

  calculateSmartScore(task, deadline, now) {
    let score = 0
    
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
    const timeDiff = deadline - now
    const hoursLeft = timeDiff / (1000 * 60 * 60)
    const isUrgent = hoursLeft < 24 || task.priority === 'high'
    const isImportant = task.priority === 'high' || task.interest > 70
    
    if (isUrgent && isImportant) return 'do'
    if (!isUrgent && isImportant) return 'schedule'
    if (isUrgent && !isImportant) return 'delegate'
    return 'eliminate'
  },

  calculateCountdown(deadline, now) {
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
        return new Date(a.deadline) - new Date(b.deadline)
      })
    } else if (this.data.sortBy === 'priority') {
      arr.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1
        return order[a.priority] - order[b.priority]
      })
    } else {
      arr.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1
        return b.createTime - a.createTime
      })
    }
    return arr
  },

  filterByEisenhower(tasks) {
    const filter = this.data.eisenhowerFilter
    if (filter === 'all') return tasks
    return tasks.filter(t => t.eisenhowerCategory === filter)
  },

  loadTasks() {
    let tasks = wx.getStorageSync('taskList') || []
    const processed = tasks.map(t => this.processTask(t))
    const filtered = this.filterByEisenhower(processed)
    this.setData({ taskList: this.sortTasks(filtered) })
  },

  getDefaultTasks() {
    const now = Date.now()
    const tomorrow = new Date(now + 24 * 60 * 60 * 1000)
    const nextWeek = new Date(now + 7 * 24 * 60 * 60 * 1000)
    
    return [
      {
        id: now - 3,
        title: '完成项目报告',
        description: '整理本周项目进展，撰写周报并准备周五汇报',
        priority: 'high',
        deadline: tomorrow.toISOString().slice(0, 16).replace('T', ' '),
        date: tomorrow.toISOString().slice(0, 10),
        interest: 80,
        completed: false,
        subtasks: [
          { id: 1, title: '收集数据', completed: true },
          { id: 2, title: '撰写报告', completed: false },
          { id: 3, title: '制作PPT', completed: false }
        ],
        createTime: now - 3
      },
      {
        id: now - 2,
        title: '学习微信小程序开发',
        description: '完成官方文档阅读和基础示例练习',
        priority: 'medium',
        deadline: nextWeek.toISOString().slice(0, 16).replace('T', ' '),
        date: nextWeek.toISOString().slice(0, 10),
        interest: 90,
        completed: false,
        subtasks: [
          { id: 4, title: '阅读基础文档', completed: true },
          { id: 5, title: '实践组件API', completed: true },
          { id: 6, title: '开发Demo项目', completed: false }
        ],
        createTime: now - 2
      },
      {
        id: now - 1,
        title: '健身运动',
        description: '每周三次有氧运动，保持身体健康',
        priority: 'low',
        deadline: new Date(now + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16).replace('T', ' '),
        date: new Date(now + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        interest: 75,
        completed: false,
        subtasks: [],
        createTime: now - 1
      },
      {
        id: now,
        title: '整理工作文档',
        description: '清理过期文件，归档重要资料',
        priority: 'low',
        deadline: new Date(now + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16).replace('T', ' '),
        date: new Date(now + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        interest: 40,
        completed: false,
        subtasks: [],
        createTime: now
      }
    ]
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

  saveTask() {
    const { title, date, time, priority, description, interest, subtasks } = this.data.formData
    if (!title.trim()) { wx.showToast({ title: '请输入任务名称', icon: 'none' }); return }
    if (!date || !time) { wx.showToast({ title: '请选择截止时间', icon: 'none' }); return }

    const deadline = date + ' ' + time
    const sts = subtasks.filter(s => s.trim()).map((t, i) => ({ id: Date.now() + i, title: t.trim(), completed: false }))

    let tasks = wx.getStorageSync('taskList') || []

    if (this.data.editingTask) {
      tasks = tasks.map(t => t.id === this.data.editingTask.id
        ? { ...t, title: title.trim(), description: description.trim(), priority, deadline, date, interest, subtasks: sts }
        : t)
    } else {
      tasks.push({
        id: Date.now(),
        title: title.trim(),
        description: description.trim(),
        priority,
        deadline,
        date,
        interest,
        completed: false,
        subtasks: sts,
        createTime: Date.now()
      })
    }

    wx.setStorageSync('taskList', tasks)
    wx.showToast({ title: '保存成功', icon: 'success' })
    this.closeModal()
    this.loadTasks()
  },

  deleteTask(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除', content: '确定要删除这个任务吗？',
      success: (res) => {
        if (res.confirm) {
          let tasks = wx.getStorageSync('taskList') || []
          tasks = tasks.filter(t => t.id !== id)
          wx.setStorageSync('taskList', tasks)
          wx.showToast({ title: '删除成功', icon: 'success' })
          this.loadTasks()
        }
      }
    })
  },

  toggleExpand(e) {
    const id = e.currentTarget.dataset.id
    this.setData({ expandedTask: this.data.expandedTask === id ? null : id })
  },

  toggleComplete(e) {
    const id = e.currentTarget.dataset.id
    let tasks = wx.getStorageSync('taskList') || []
    const task = tasks.find(t => t.id === id)
    if (task && !task.completed) {
      const completedTask = { 
        ...task, 
        completed: true, 
        completedTime: Date.now(),
        completionDate: this.formatDate(new Date())
      }
      let recycleBin = wx.getStorageSync('recycleBin') || []
      recycleBin.push(completedTask)
      wx.setStorageSync('recycleBin', recycleBin)
      
      this.recordTaskCompletion(task)
      
      tasks = tasks.filter(t => t.id !== id)
      wx.setStorageSync('taskList', tasks)
      wx.showToast({ title: '已移至回收站', icon: 'success' })
    }
    this.loadTasks()
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

  toggleSubtask(e) {
    const taskId = e.currentTarget.dataset.taskId
    const subId = e.currentTarget.dataset.subId
    let tasks = wx.getStorageSync('taskList') || []
    tasks = tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, subtasks: t.subtasks.map(s => s.id === subId ? { ...s, completed: !s.completed } : s) }
      }
      return t
    })
    wx.setStorageSync('taskList', tasks)
    this.loadTasks()
  },

  editTask(e) {
    const id = e.currentTarget.dataset.id
    const tasks = wx.getStorageSync('taskList') || []
    const task = tasks.find(t => t.id === id)
    if (!task) return

    const deadlineParts = task.deadline.split(' ')
    const date = deadlineParts[0] || ''
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
  }
})