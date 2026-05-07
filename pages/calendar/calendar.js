// pages/calendar/calendar.js
Page({
  data: {
    currentView: 'month',
    theme: 'light',
    currentDateText: '',
    todayText: '',
    currentDateStr: '',
    monthYearText: '',
    sortBy: 'deadline',
    sortLabel: '按截止时间',
    showSortModal: false,
    showHabitsModal: false,
    showAIModal: false,
    priorityLabels: { high: '高', medium: '中', low: '低' },
    sortedTodos: [],
    todayTodos: [],
    monthCells: [],
    yearMonths: [],
    totalTasks: 0,
    totalCompleted: 0,
    goodHabits: [
      { id: 1, icon: '🌅', name: '早起', desc: '每天6:30前起床', selected: false, streak: 0, targetDays: 21 },
      { id: 2, icon: '📚', name: '阅读', desc: '每天阅读30分钟', selected: false, streak: 0, targetDays: 21 },
      { id: 3, icon: '🏃', name: '运动', desc: '每天运动30分钟', selected: false, streak: 0, targetDays: 21 },
      { id: 4, icon: '💧', name: '喝水', desc: '每天喝8杯水', selected: false, streak: 0, targetDays: 21 },
      { id: 5, icon: '😴', name: '早睡', desc: '每晚11点前入睡', selected: false, streak: 0, targetDays: 21 },
      { id: 6, icon: '📝', name: '复盘', desc: '每天总结学习情况', selected: false, streak: 0, targetDays: 21 }
    ],
    aiSuggestions: [
      { id: 1, icon: '⏰', text: '建议将高优先级任务安排在上午9:00-11:00' },
      { id: 2, icon: '📚', text: '本周数学任务较多，建议增加复习时间' },
      { id: 3, icon: '🎯', text: '你的完成率已达75%，继续保持！' }
    ],
    habitCheckins: {}
  },

  onLoad() {
    const now = new Date()
    const theme = wx.getStorageSync('theme') || 'light'
    this.setData({ currentDateStr: this.formatDateStr(now), theme })
    this.updateAll()
    this.loadHabits()
  },

  onShow() {
    const theme = wx.getStorageSync('theme') || 'light'
    this.setData({ theme })
    this.loadTasksAndUpdate()
  },

  loadTasksAndUpdate() {
    const tasks = wx.getStorageSync('taskList') || []
    const validatedTasks = tasks.filter(t => t.date && t.title)
    if (tasks.length !== validatedTasks.length) {
      wx.setStorageSync('taskList', validatedTasks)
    }
    this.updateAll()
  },

  formatDateStr(date) {
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0')
  },

  parseDate(str) {
    if (!str || typeof str !== 'string') {
      return new Date()
    }
    const p = str.split('-')
    if (p.length !== 3) {
      return new Date()
    }
    return new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2]))
  },

  updateAll() {
    this.updateDateText()
    this.generateMonthCells()
    this.generateYearMonths()
    this.updateSortedTodos()
    this.loadTodayTodos()
  },

  updateDateText() {
    const date = this.parseDate(this.data.currentDateStr)
    const y = date.getFullYear()
    const m = date.getMonth() + 1
    const d = date.getDate()
    const wd = ['日','一','二','三','四','五','六'][date.getDay()]

    let text = ''
    if (this.data.currentView === 'day') text = y + '年' + m + '月' + d + '日 星期' + wd
    else if (this.data.currentView === 'month') text = y + '年' + m + '月'
    else text = y + '年'

    this.setData({
      currentDateText: text,
      todayText: m + '月' + d + '日',
      monthYearText: y + '年' + m + '月'
    })
  },

  getWeekNumber(date) {
    const start = new Date(date.getFullYear(), 0, 1)
    return Math.ceil((((date - start) / 86400000) + start.getDay() + 1) / 7)
  },

  switchView(e) {
    this.setData({ currentView: e.currentTarget.dataset.view })
    this.updateDateText()
  },

  prevPeriod() {
    const date = this.parseDate(this.data.currentDateStr)
    if (this.data.currentView === 'day') date.setDate(date.getDate() - 1)
    else if (this.data.currentView === 'month') date.setMonth(date.getMonth() - 1)
    else date.setFullYear(date.getFullYear() - 1)
    this.setData({ currentDateStr: this.formatDateStr(date) })
    this.updateAll()
  },

  nextPeriod() {
    const date = this.parseDate(this.data.currentDateStr)
    if (this.data.currentView === 'day') date.setDate(date.getDate() + 1)
    else if (this.data.currentView === 'month') date.setMonth(date.getMonth() + 1)
    else date.setFullYear(date.getFullYear() + 1)
    this.setData({ currentDateStr: this.formatDateStr(date) })
    this.updateAll()
  },

  generateMonthCells() {
    const date = this.parseDate(this.data.currentDateStr)
    const y = date.getFullYear(), m = date.getMonth()
    const first = new Date(y, m, 1), last = new Date(y, m + 1, 0)
    const today = new Date()
    const todayStr = this.formatDateStr(today)
    const tasks = wx.getStorageSync('taskList') || []
    const recycleBin = wx.getStorageSync('recycleBin') || []
    const allTasks = [...tasks, ...recycleBin]
    const habits = wx.getStorageSync('dailyHabits') || {}

    const cells = []
    const startDow = first.getDay()
    for (let i = startDow - 1; i >= 0; i--) {
      const d = new Date(y, m, -i)
      const ds = this.formatDateStr(d)
      cells.push({ 
        day: d.getDate(), 
        date: ds, 
        isCurrentMonth: false, 
        isToday: false,
        isPast: ds < todayStr,
        isFuture: ds > todayStr,
        tasks: [], 
        hasTask: false, 
        habitCompleted: false 
      })
    }
    for (let i = 1; i <= last.getDate(); i++) {
      const d = new Date(y, m, i)
      const ds = this.formatDateStr(d)
      const dayTasks = allTasks.filter(t => {
        if (!t.date) return false
        const taskDate = t.date.split(' ')[0] || t.date
        return taskDate === ds
      })
      cells.push({
        day: i, 
        date: ds, 
        isCurrentMonth: true,
        isToday: ds === todayStr,
        isPast: ds < todayStr,
        isFuture: ds > todayStr,
        tasks: dayTasks.slice(0, 3),
        hasTask: dayTasks.length > 0,
        habitCompleted: habits[ds] || false
      })
    }
    const rem = 42 - cells.length
    for (let i = 1; i <= rem; i++) {
      const d = new Date(y, m + 1, i)
      const ds = this.formatDateStr(d)
      cells.push({ 
        day: i, 
        date: ds, 
        isCurrentMonth: false, 
        isToday: false,
        isPast: ds < todayStr,
        isFuture: ds > todayStr,
        tasks: [], 
        hasTask: false, 
        habitCompleted: false 
      })
    }
    this.setData({ monthCells: cells })
  },

  generateYearMonths() {
    const date = this.parseDate(this.data.currentDateStr)
    const y = date.getFullYear()
    const tasks = wx.getStorageSync('taskList') || []
    const recycleBin = wx.getStorageSync('recycleBin') || []
    const allTasks = [...tasks, ...recycleBin]
    const names = ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月']
    const months = []

    let totalTasks = 0
    let totalCompleted = 0

    for (let i = 0; i < 12; i++) {
      const mt = allTasks.filter(t => {
        const td = this.parseDate(t.date)
        return td.getFullYear() === y && td.getMonth() === i
      })
      const completedCount = mt.filter(t => t.completed).length
      const pendingCount = mt.length - completedCount
      const completedPercent = mt.length > 0 ? Math.round((completedCount / mt.length) * 100) : 0
      const pendingPercent = 100 - completedPercent

      totalTasks += mt.length
      totalCompleted += completedCount

      months.push({
        name: names[i], month: i + 1,
        taskCount: mt.length,
        completedCount: completedCount,
        pendingCount: pendingCount,
        completedPercent: completedPercent,
        pendingPercent: pendingPercent
      })
    }

    this.setData({ 
      yearMonths: months,
      totalTasks: totalTasks,
      totalCompleted: totalCompleted
    })
  },

  updateSortedTodos() {
    const tasks = wx.getStorageSync('taskList') || []
    const recycleBin = wx.getStorageSync('recycleBin') || []
    const allTasks = [...tasks, ...recycleBin]
    const today = this.formatDateStr(new Date())
    const todayTasks = allTasks.filter(t => {
      if (!t.date) return false
      const taskDate = t.date.split(' ')[0] || t.date
      return taskDate === today
    })
    const list = todayTasks.map(t => ({
      id: t.id, event: t.title, deadline: t.deadline.split(' ')[1] || t.deadline,
      completed: t.completed, priority: t.priority, interest: t.interest || 50
    }))

    const order = { high: 0, medium: 1, low: 2 }
    if (this.data.sortBy === 'deadline') list.sort((a, b) => a.deadline.localeCompare(b.deadline))
    else if (this.data.sortBy === 'priority') list.sort((a, b) => order[a.priority] - order[b.priority])
    else if (this.data.sortBy === 'interest') list.sort((a, b) => b.interest - a.interest)
    else list.sort((a, b) => order[a.priority] - order[b.priority])

    this.setData({ sortedTodos: list })
  },

  loadTodayTodos() {
    const tasks = wx.getStorageSync('taskList') || []
    const recycleBin = wx.getStorageSync('recycleBin') || []
    const allTasks = [...tasks, ...recycleBin]
    const today = this.formatDateStr(new Date())
    const todayTodos = allTasks.filter(t => {
      if (!t.date) return false
      const taskDate = t.date.split(' ')[0] || t.date
      return taskDate === today
    })
    this.setData({ todayTodos })
  },

  loadMore() {
    this.loadTodayTodos()
  },

  selectDate(e) {
    const ds = e.currentTarget.dataset.date
    this.setData({ currentDateStr: ds, currentView: 'day' })
    this.updateAll()
  },

  toggleTodo(e) {
    const id = e.currentTarget.dataset.id
    let tasks = wx.getStorageSync('taskList') || []
    tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    wx.setStorageSync('taskList', tasks)
    this.updateSortedTodos()
    this.generateMonthCells()
    this.loadTodayTodos()
  },

  goToAddTask() {
    wx.switchTab({ url: '/pages/task/task' })
  },

  showSortOptions() { this.setData({ showSortModal: true }) },
  closeSortModal() { this.setData({ showSortModal: false }) },
  preventClose() {},

  setSort(e) {
    const sortBy = e.currentTarget.dataset.sort
    const labels = { deadline: '按截止时间', priority: '按重要程度', interest: '按兴趣程度', efficient: '高效时段优先' }
    this.setData({ sortBy, sortLabel: labels[sortBy], showSortModal: false })
    this.updateSortedTodos()
  },

  showHabitsModal() { this.setData({ showHabitsModal: true }) },
  closeHabitsModal() { this.setData({ showHabitsModal: false }) },

  loadHabits() {
    const selected = wx.getStorageSync('selectedHabits') || []
    const habitCheckins = wx.getStorageSync('habitCheckins') || {}
    const habits = this.data.goodHabits.map(h => {
      const checkins = habitCheckins[h.id] || []
      const streak = this.calculateStreak(checkins)
      return { ...h, selected: selected.includes(h.id), streak }
    })
    this.setData({ goodHabits: habits, habitCheckins })
  },

  calculateStreak(checkins) {
    if (!checkins || checkins.length === 0) return 0
    checkins.sort((a, b) => new Date(b) - new Date(a))
    
    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    for (let i = 0; i < checkins.length; i++) {
      const checkinDate = new Date(checkins[i])
      checkinDate.setHours(0, 0, 0, 0)
      const expectedDate = new Date(today)
      expectedDate.setDate(expectedDate.getDate() - i)
      
      if (checkinDate.getTime() === expectedDate.getTime()) {
        streak++
      } else {
        break
      }
    }
    return streak
  },

  toggleHabit(e) {
    const id = e.currentTarget.dataset.id
    const habits = this.data.goodHabits.map(h => {
      if (h.id === id) {
        const isSelected = !h.selected
        if (isSelected) {
          return { ...h, selected: true, streak: 0 }
        }
        return { ...h, selected: false }
      }
      return h
    })
    this.setData({ goodHabits: habits })
    const selected = habits.filter(h => h.selected).map(h => h.id)
    wx.setStorageSync('selectedHabits', selected)
    
    if (habits.find(h => h.id === id)?.selected) {
      this.addHabitToCheckin(id)
    } else {
      this.removeHabitFromCheckin(id)
    }
    
    this.updateHabitCompletion()
  },

  addHabitToCheckin(habitId) {
    const today = this.formatDateStr(new Date())
    let habitCheckins = wx.getStorageSync('habitCheckins') || {}
    
    if (!habitCheckins[habitId]) {
      habitCheckins[habitId] = []
    }
    
    if (!habitCheckins[habitId].includes(today)) {
      habitCheckins[habitId].push(today)
    }
    
    wx.setStorageSync('habitCheckins', habitCheckins)
    this.setData({ habitCheckins })
    
    const habits = this.data.goodHabits.map(h => {
      if (h.id === habitId) {
        const checkins = habitCheckins[habitId] || []
        return { ...h, streak: this.calculateStreak(checkins) }
      }
      return h
    })
    this.setData({ goodHabits: habits })
    
    wx.showToast({ 
      title: '已加入21天打卡计划', 
      icon: 'success',
      duration: 2000 
    })
  },

  removeHabitFromCheckin(habitId) {
    let habitCheckins = wx.getStorageSync('habitCheckins') || {}
    delete habitCheckins[habitId]
    wx.setStorageSync('habitCheckins', habitCheckins)
    this.setData({ habitCheckins })
    
    const habits = this.data.goodHabits.map(h => {
      if (h.id === habitId) {
        return { ...h, streak: 0 }
      }
      return h
    })
    this.setData({ goodHabits: habits })
  },

  updateHabitCompletion() {
    const today = this.formatDateStr(new Date())
    const selectedHabits = wx.getStorageSync('selectedHabits') || []
    const habits = this.data.goodHabits
    const completedHabits = habits.filter(h => selectedHabits.includes(h.id))
    const dailyHabits = wx.getStorageSync('dailyHabits') || {}
    dailyHabits[today] = {
      completed: completedHabits.length > 0,
      habitIds: selectedHabits,
      habitNames: completedHabits.map(h => h.name)
    }
    wx.setStorageSync('dailyHabits', dailyHabits)
    this.generateMonthCells()
  },

  checkinHabit(e) {
    const habitId = e.currentTarget.dataset.id
    const today = this.formatDateStr(new Date())
    let habitCheckins = wx.getStorageSync('habitCheckins') || {}
    
    if (!habitCheckins[habitId]) {
      habitCheckins[habitId] = []
    }
    
    if (habitCheckins[habitId].includes(today)) {
      wx.showToast({ title: '今天已经打卡过了', icon: 'none' })
      return
    }
    
    habitCheckins[habitId].push(today)
    wx.setStorageSync('habitCheckins', habitCheckins)
    this.setData({ habitCheckins })
    
    const habits = this.data.goodHabits.map(h => {
      if (h.id === habitId) {
        const checkins = habitCheckins[habitId] || []
        return { ...h, streak: this.calculateStreak(checkins) }
      }
      return h
    })
    this.setData({ goodHabits: habits })
    
    wx.showToast({ 
      title: '打卡成功！', 
      icon: 'success',
      duration: 1500 
    })
    
    this.updateHabitCompletion()
  },

  saveHabits() {
    const selected = this.data.goodHabits.filter(h => h.selected).map(h => h.id)
    wx.setStorageSync('selectedHabits', selected)
    this.updateHabitCompletion()
    wx.showToast({ title: '保存成功', icon: 'success' })
    this.closeHabitsModal()
  },

  showAISuggestion() {
    const suggestions = [
      { id: 1, icon: '⏰', text: '建议将高优先级任务安排在上午9:00-11:00', selected: false },
      { id: 2, icon: '📚', text: '本周数学任务较多，建议增加复习时间', selected: false },
      { id: 3, icon: '🎯', text: '你的完成率已达75%，继续保持！', selected: false },
      { id: 4, icon: '💡', text: '建议每天固定时间进行专注学习', selected: false }
    ]
    this.setData({ aiSuggestions: suggestions, showAIModal: true })
  },

  closeAIModal() { this.setData({ showAIModal: false }) },

  toggleAISuggestion(e) {
    const id = e.currentTarget.dataset.id
    const suggestions = this.data.aiSuggestions.map(s => 
      s.id === id ? { ...s, selected: !s.selected } : s
    )
    this.setData({ aiSuggestions: suggestions })
  },

  applyAISuggestion() {
    const selectedSuggestions = this.data.aiSuggestions.filter(s => s.selected)
    if (selectedSuggestions.length === 0) {
      wx.showToast({ title: '请先选择建议', icon: 'none' })
      return
    }
    const appliedCount = selectedSuggestions.length
    const suggestionTexts = selectedSuggestions.map(s => s.text).join('；')
    wx.setStorageSync('appliedSuggestions', selectedSuggestions.map(s => s.id))
    wx.showToast({ title: `已应用${appliedCount}条建议`, icon: 'success' })
    this.closeAIModal()
  },

  getPriorityColor(priority) {
    return { high: '#FF6B6B', medium: '#FFB347', low: '#98D8C8' }[priority] || '#ccc'
  },

  showMonthDetail(e) {
    const month = e.currentTarget.dataset.month
    const date = this.parseDate(this.data.currentDateStr)
    const newDate = new Date(date.getFullYear(), month - 1, 1)
    this.setData({ 
      currentDateStr: this.formatDateStr(newDate), 
      currentView: 'month' 
    })
    this.updateAll()
  }
})