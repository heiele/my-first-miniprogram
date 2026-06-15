// pages/index/index.js
Page({
  data: {
    nickName: '同学',
    theme: 'light',
    greeting: '',
    todayDate: '',
    todoList: [],
    completedCount: 0,
    totalCount: 0,
    completionRate: 0,
    weeklyData: [
      { day: '一', percent: 0 },
      { day: '二', percent: 0 },
      { day: '三', percent: 0 },
      { day: '四', percent: 0 },
      { day: '五', percent: 0 },
      { day: '六', percent: 0 },
      { day: '日', percent: 0 }
    ],
    studyGoal: {
      dailyDuration: 180,
      types: [],
      deadline: '',
      checkInRecords: []
    },
    todayCheckedIn: false,
    customDuration: '',
    suggestions: [
      { id: 1, icon: '📚', title: '专注薄弱科目', desc: '根据学习记录，建议增加数学练习时间' },
      { id: 2, icon: '⏰', title: '合理安排时间', desc: '下午14:00-16:00是你的高效时段' },
      { id: 3, icon: '🏃', title: '劳逸结合', desc: '连续学习2小时后建议休息15分钟' }
    ],
    selfAnalysis: {
      strengths: [],
      weaknesses: []
    },
    timeSegments: [
      { period: '早晨', efficiency: 85, selected: false },
      { period: '上午', efficiency: 70, selected: false },
      { period: '中午', efficiency: 30, selected: false },
      { period: '下午', efficiency: 60, selected: false },
      { period: '傍晚', efficiency: 45, selected: false },
      { period: '晚上', efficiency: 75, selected: false }
    ],
    bestTimeSlot: '早晨 6:00-8:00',
    userPreferredSlots: [],
    showTimeSlotModal: false,
    showReportModal: false,
    showGoalModal: false,
    reportData: {
      monthlyCompleted: 0,
      monthlyTotal: 0,
      monthlyRate: 0,
      habits: [],
      achievements: [],
      weeklyTrend: []
    },
    focusTasks: [],
    pendingReminders: [],
    reminderInterval: null,
    customGoalType: '',
    defaultGoalTypes: ['考试备考', '技能学习', '语言学习', '职业发展', '兴趣爱好', '证书考试']
  },

  onLoad() {
    this.initPage()
  },
  
  async initPage() {
    try {
      const nickName = wx.getStorageSync('nickName') || '同学'
      const theme = wx.getStorageSync('theme') || 'light'
      this.setData({ nickName, theme })
      
      await this.safeExecute('setGreeting', () => this.setGreeting())
      await this.safeExecute('setTodayDate', () => this.setTodayDate())
      await this.safeExecute('moveExpiredTasksToRecycle', () => this.moveExpiredTasksToRecycle())
      await this.safeExecute('loadTasks', () => this.loadTasks())
      await this.safeExecute('loadWeeklyData', () => this.loadWeeklyData())
      await this.safeExecute('loadSelfAnalysis', () => this.loadSelfAnalysis())
      await this.safeExecute('analyzeEfficiency', () => this.analyzeEfficiency())
      await this.safeExecute('loadStudyGoal', () => this.loadStudyGoal())
      await this.safeExecute('generateSuggestions', () => this.generateSuggestions())
    } catch (e) {
      console.error('index page init error:', e)
    }
  },
  
  safeExecute(name, fn) {
    return new Promise(resolve => {
      const timer = setTimeout(() => {
        console.warn(`${name} timeout, continuing`)
        resolve()
      }, 3000)
      
      try {
        fn()
        clearTimeout(timer)
        resolve()
      } catch (e) {
        clearTimeout(timer)
        console.error(`${name} error:`, e)
        resolve()
      }
    })
  },

  onShow() {
    const theme = wx.getStorageSync('theme') || 'light'
    this.setData({ theme })
    this.moveExpiredTasksToRecycle()
    this.loadTasks()
    this.loadWeeklyData()
    this.loadStudyGoal()
  },

  onReady() {
    this.drawPieChart()
  },

  setGreeting() {
    const hour = new Date().getHours()
    let greeting = '晚上好'
    if (hour >= 6 && hour < 12) greeting = '早上好'
    else if (hour >= 12 && hour < 14) greeting = '中午好'
    else if (hour >= 14 && hour < 18) greeting = '下午好'
    this.setData({ greeting })
  },

  setTodayDate() {
    const now = new Date()
    const weekDays = ['日', '一', '二', '三', '四', '五', '六']
    const month = now.getMonth() + 1
    const day = now.getDate()
    const weekDay = weekDays[now.getDay()]
    this.setData({ todayDate: month + '月' + day + '日 星期' + weekDay })
  },

  formatDate(date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return y + '-' + m + '-' + d
  },

  moveExpiredTasksToRecycle() {
    const today = this.formatDate(new Date())
    let tasks = wx.getStorageSync('taskList') || []
    let recycleBin = wx.getStorageSync('recycleBin') || []
    
    const expiredTasks = tasks.filter(t => !t.completed && t.date < today)
    
    if (expiredTasks.length > 0) {
      expiredTasks.forEach(task => {
        recycleBin.push({ ...task, completed: true, completedTime: Date.now(), expired: true })
      })
      
      tasks = tasks.filter(t => !(t.date < today && !t.completed))
      
      wx.setStorageSync('taskList', tasks)
      wx.setStorageSync('recycleBin', recycleBin)
    }
  },

  loadTasks() {
    const tasks = wx.getStorageSync('taskList') || []
    const today = this.formatDate(new Date())
    const todayTasks = tasks.filter(t => t.date === today)
    
    const processedTasks = todayTasks.map(t => {
      const deadline = new Date(t.deadline.replace(' ', 'T'))
      const now = new Date()
      const score = this.calculateSmartScore(t, deadline, now)
      const countdown = this.calculateCountdown(deadline, now)
      const priorityClass = score >= 80 ? 'high' : score >= 50 ? 'medium' : 'low'
      return {
        id: t.id,
        event: t.title,
        deadline: t.deadline.split(' ')[1] || t.deadline,
        completed: t.completed,
        priority: t.priority,
        score,
        priorityClass,
        countdown
      }
    }).sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1
      return b.score - a.score
    })

    const focusTasks = processedTasks.filter(t => !t.completed).slice(0, 3)

    const completedCount = todayTasks.filter(t => t.completed).length
    const totalCount = todayTasks.length
    const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

    this.setData({ todoList: processedTasks, completedCount, totalCount, completionRate, focusTasks })
    
    this.checkReminders()
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

  checkReminders() {
    const now = new Date()
    const pendingReminders = []
    
    this.data.todoList.forEach(task => {
      if (task.completed) return
      
      const deadline = new Date(task.date + ' ' + task.deadline)
      const timeDiff = deadline - now
      const minutesLeft = timeDiff / (1000 * 60)
      
      if (minutesLeft > 0 && minutesLeft <= 30 && task.countdown.type === 'urgent') {
        pendingReminders.push(task)
      }
    })
    
    this.setData({ pendingReminders })
    
    if (pendingReminders.length > 0) {
      this.showReminderNotification(pendingReminders[0])
    }
  },

  showReminderNotification(task) {
    wx.showModal({
      title: '⏰ 任务提醒',
      content: `「${task.event}」即将截止！${task.countdown.text}`,
      confirmText: '立即查看',
      cancelText: '稍后',
      success: (res) => {
        if (res.confirm) {
          wx.switchTab({ url: '/pages/task/task' })
        }
      }
    })
  },

  analyzeEfficiency() {
    const records = wx.getStorageSync('focusRecords') || []
    const userPreferredSlots = wx.getStorageSync('userPreferredSlots') || []
    
    const segments = { '早晨': [], '上午': [], '中午': [], '下午': [], '傍晚': [], '晚上': [] }
    records.forEach(r => {
      const hour = new Date(r.time).getHours()
      if (hour >= 6 && hour < 9) segments['早晨'].push(r.duration)
      else if (hour >= 9 && hour < 12) segments['上午'].push(r.duration)
      else if (hour >= 12 && hour < 14) segments['中午'].push(r.duration)
      else if (hour >= 14 && hour < 17) segments['下午'].push(r.duration)
      else if (hour >= 17 && hour < 19) segments['傍晚'].push(r.duration)
      else segments['晚上'].push(r.duration)
    })

    const taskCompletionByPeriod = this.calculateTaskCompletionByPeriod()

    const timeSegments = Object.entries(segments).map(([period, durations]) => {
      const baseEfficiency = durations.length > 0 ? Math.min(100, (durations.reduce((a, b) => a + b, 0) / durations.length) * 2) : 20
      const completionBonus = taskCompletionByPeriod[period] || 0
      const userPreferenceBonus = userPreferredSlots.includes(period) ? 15 : 0
      const efficiency = Math.min(100, baseEfficiency + completionBonus + userPreferenceBonus)
      const efficiencyClass = efficiency > 70 ? 'high' : efficiency > 40 ? 'medium' : 'low'
      
      return {
        period,
        efficiency: Math.round(efficiency),
        efficiencyClass,
        selected: userPreferredSlots.includes(period)
      }
    })

    const maxSegment = timeSegments.reduce((max, s) => s.efficiency > max.efficiency ? s : max, timeSegments[0])
    const bestTimeSlot = this.getTimeSlotRange(maxSegment.period)

    this.setData({ timeSegments, bestTimeSlot, userPreferredSlots })
  },

  calculateTaskCompletionByPeriod() {
    const tasks = wx.getStorageSync('taskList') || []
    const recycleBin = wx.getStorageSync('recycleBin') || []
    const allTasks = [...tasks, ...recycleBin]
    const periodTasks = { '早晨': { completed: 0, total: 0 }, '上午': { completed: 0, total: 0 }, '中午': { completed: 0, total: 0 }, '下午': { completed: 0, total: 0 }, '傍晚': { completed: 0, total: 0 }, '晚上': { completed: 0, total: 0 } }
    
    allTasks.forEach(task => {
      const deadline = task.deadline || ''
      const match = deadline.match(/ (\d{2}):/)
      if (match) {
        const hour = parseInt(match[1])
        let period = '晚上'
        if (hour >= 6 && hour < 9) period = '早晨'
        else if (hour >= 9 && hour < 12) period = '上午'
        else if (hour >= 12 && hour < 14) period = '中午'
        else if (hour >= 14 && hour < 17) period = '下午'
        else if (hour >= 17 && hour < 19) period = '傍晚'
        
        periodTasks[period].total++
        if (task.completed) periodTasks[period].completed++
      }
    })

    const result = {}
    Object.entries(periodTasks).forEach(([period, data]) => {
      if (data.total > 0) {
        result[period] = Math.round((data.completed / data.total) * 20)
      }
    })
    return result
  },

  getTimeSlotRange(period) {
    const ranges = {
      '早晨': '6:00-9:00',
      '上午': '9:00-12:00',
      '中午': '12:00-14:00',
      '下午': '14:00-17:00',
      '傍晚': '17:00-19:00',
      '晚上': '19:00-23:00'
    }
    return period + ' ' + ranges[period]
  },

  drawPieChart() {
    const completed = this.data.completedCount
    const total = this.data.totalCount
    const rate = this.data.completionRate
    const pending = total - completed

    const ctx = wx.createCanvasContext('pieChart', this)
    const centerX = 75, centerY = 75, radius = 60, innerRadius = 38

    if (total === 0) {
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
      ctx.setFillStyle('#E8E8E8')
      ctx.fill()
      ctx.beginPath()
      ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI)
      ctx.setFillStyle('#fff')
      ctx.fill()
      ctx.setFontSize(12)
      ctx.setFillStyle('#999')
      ctx.setTextAlign('center')
      ctx.setTextBaseline('middle')
      ctx.fillText('暂无数据', centerX, centerY)
      ctx.draw()
      return
    }

    const completedAngle = (completed / total) * 2 * Math.PI
    const startAngle = -Math.PI / 2

    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, startAngle, startAngle + completedAngle)
    ctx.setFillStyle('#4A90D9')
    ctx.fill()

    if (pending > 0) {
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, startAngle + completedAngle, startAngle + 2 * Math.PI)
      ctx.setFillStyle('#E8E8E8')
      ctx.fill()
    }

    ctx.beginPath()
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI)
    ctx.setFillStyle('#fff')
    ctx.fill()

    ctx.setFontSize(20)
    ctx.setFillStyle('#333')
    ctx.setTextAlign('center')
    ctx.setTextBaseline('middle')
    ctx.fillText(rate + '%', centerX, centerY - 6)

    ctx.setFontSize(10)
    ctx.setFillStyle('#999')
    ctx.fillText(`${completed}/${total}`, centerX, centerY + 14)

    ctx.draw()
  },

  toggleTodo(e) {
    const id = e.currentTarget.dataset.id
    let tasks = wx.getStorageSync('taskList') || []
    let recycleBin = wx.getStorageSync('recycleBin') || []
    
    const task = tasks.find(t => t.id === id)
    const recycledTask = recycleBin.find(t => t.id === id)
    
    if (task && !task.completed) {
      const completedTask = { ...task, completed: true, completedTime: Date.now(), completionDate: this.formatDate(new Date()) }
      recycleBin.push(completedTask)
      wx.setStorageSync('recycleBin', recycleBin)
      
      this.recordTaskCompletion(task)
      
      tasks = tasks.filter(t => t.id !== id)
      wx.setStorageSync('taskList', tasks)
      wx.showToast({ title: '已移至回收站', icon: 'success' })
    } else if (recycledTask) {
      recycleBin = recycleBin.filter(t => t.id !== id)
      wx.setStorageSync('recycleBin', recycleBin)
      
      const restoredTask = { ...recycledTask, completed: false, completedTime: null, completionDate: null }
      tasks.push(restoredTask)
      wx.setStorageSync('taskList', tasks)
      wx.showToast({ title: '已恢复', icon: 'success' })
    }
    this.loadTasks()
    this.loadWeeklyData()
    this.drawPieChart()
    this.generateSuggestions()
    this.analyzeEfficiency()
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

  goToTask() {
    wx.switchTab({ url: '/pages/task/task' })
  },

  goToFocus() {
    wx.switchTab({ url: '/pages/focus/focus' })
  },

  viewReport() {
    this.loadReportData()
    this.setData({ showReportModal: true })
    setTimeout(() => {
      this.drawMonthlyPieChart()
    }, 100)
  },

  closeReportModal() {
    this.setData({ showReportModal: false })
  },

  loadReportData() {
    const tasks = wx.getStorageSync('taskList') || []
    const recycleBin = wx.getStorageSync('recycleBin') || []
    const allTasks = [...tasks, ...recycleBin]
    const today = new Date()
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(today.getMonth() - 1)
    
    const monthTasks = allTasks.filter(t => {
      const taskDate = new Date(t.date)
      return taskDate >= oneMonthAgo && taskDate <= today
    })
    
    const monthlyCompleted = monthTasks.filter(t => t.completed).length
    const monthlyTotal = monthTasks.length
    const monthlyRate = monthlyTotal > 0 ? Math.round((monthlyCompleted / monthlyTotal) * 100) : 0

    const habits = this.analyzeHabits(allTasks)
    const achievements = this.generateAchievements(monthlyCompleted, monthlyRate, habits)
    const weeklyTrend = this.calculateWeeklyTrend(allTasks)

    this.setData({
      reportData: {
        monthlyCompleted,
        monthlyTotal,
        monthlyRate,
        habits,
        achievements,
        weeklyTrend
      }
    })
  },

  analyzeHabits(tasks) {
    const today = new Date()
    const days = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      days.push(this.formatDate(date))
    }

    const tasksFromStorage = wx.getStorageSync('taskList') || []
    const recycleBin = wx.getStorageSync('recycleBin') || []
    const allTasks = [...tasksFromStorage, ...recycleBin]

    const completionByDate = {}
    days.forEach(day => {
      const dayTasks = allTasks.filter(t => t.date === day)
      completionByDate[day] = dayTasks.length > 0 ? dayTasks.filter(t => t.completed).length / dayTasks.length : 0
    })

    const habits = []
    const habitDefinitions = [
      { id: 1, name: '早起学习', icon: '🌅', desc: '连续早上完成学习任务', check: (dates) => dates.some(d => {
        const hour = new Date(d).getHours()
        return hour >= 6 && hour < 9
      })},
      { id: 2, name: '每日坚持', icon: '🔥', desc: '每天都有完成学习任务', check: (dates) => {
        let streak = 0
        let maxStreak = 0
        days.forEach(day => {
          if (completionByDate[day] >= 0.5) {
            streak++
            maxStreak = Math.max(maxStreak, streak)
          } else {
            streak = 0
          }
        })
        return maxStreak
      }},
      { id: 3, name: '高效专注', icon: '⚡', desc: '任务完成率高', check: () => {
        const completed = tasks.filter(t => t.completed).length
        const total = tasks.length
        return total > 0 ? Math.round((completed / total) * 100) : 0
      }},
      { id: 4, name: '计划达人', icon: '📝', desc: '制定并完成学习计划', check: () => {
        const weeklyPlan = wx.getStorageSync('weeklyPlan') || []
        return weeklyPlan.filter(p => p.completed).length
      }}
    ]

    habitDefinitions.forEach(habit => {
      const result = habit.check(days)
      if ((typeof result === 'number' && result >= 7) || (typeof result === 'boolean' && result)) {
        habits.push({
          id: habit.id,
          name: habit.name,
          icon: habit.icon,
          desc: habit.desc,
          streak: typeof result === 'number' ? result : 7
        })
      }
    })

    return habits.slice(0, 4)
  },

  generateAchievements(monthlyCompleted, monthlyRate, habits) {
    const achievements = []
    
    if (monthlyCompleted >= 30) achievements.push({ id: 1, icon: '🏅', name: '学习达人' })
    if (monthlyCompleted >= 15) achievements.push({ id: 2, icon: '📚', name: '勤奋学习者' })
    if (monthlyRate >= 80) achievements.push({ id: 3, icon: '⭐', name: '高效能手' })
    if (monthlyRate >= 60) achievements.push({ id: 4, icon: '🎯', name: '目标达成' })
    if (habits.length >= 2) achievements.push({ id: 5, icon: '🌟', name: '习惯养成者' })
    if (habits.length >= 3) achievements.push({ id: 6, icon: '👑', name: '全能学霸' })
    
    return achievements.slice(0, 6)
  },

  calculateWeeklyTrend(tasks) {
    const today = new Date()
    const weeklyTrend = []
    const weekLabels = ['4周前', '3周前', '2周前', '上周', '本周']
    
    for (let w = 4; w >= 0; w--) {
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - today.getDay() + 1 - w * 7)
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      
      const weekTasks = tasks.filter(t => {
        const taskDate = new Date(t.date)
        return taskDate >= startOfWeek && taskDate <= endOfWeek
      })
      
      const completed = weekTasks.filter(t => t.completed).length
      const percent = weekTasks.length > 0 ? Math.round((completed / weekTasks.length) * 100) : 0
      weeklyTrend.push({ week: weekLabels[4 - w], percent })
    }
    
    return weeklyTrend
  },

  drawMonthlyPieChart() {
    const completed = this.data.reportData.monthlyCompleted
    const total = this.data.reportData.monthlyTotal
    const rate = this.data.reportData.monthlyRate

    const ctx = wx.createCanvasContext('monthlyPieChart', this)
    const centerX = 80, centerY = 80, radius = 65, innerRadius = 45

    if (total === 0) {
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
      ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI, true)
      ctx.setFillStyle('#E8E8E8')
      ctx.fill()
      ctx.setFontSize(12)
      ctx.setFillStyle('#999')
      ctx.setTextAlign('center')
      ctx.fillText('暂无数据', centerX, centerY)
      ctx.draw()
      return
    }

    const completedAngle = (completed / total) * 2 * Math.PI
    const startAngle = -Math.PI / 2

    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, startAngle, startAngle + completedAngle)
    ctx.arc(centerX, centerY, innerRadius, startAngle + completedAngle, startAngle, true)
    ctx.closePath()
    ctx.setFillStyle('#4A90D9')
    ctx.fill()

    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, startAngle + completedAngle, startAngle + 2 * Math.PI)
    ctx.arc(centerX, centerY, innerRadius, startAngle + 2 * Math.PI, startAngle + completedAngle, true)
    ctx.closePath()
    ctx.setFillStyle('#E8E8E8')
    ctx.fill()

    ctx.setFontSize(18)
    ctx.setFillStyle('#333')
    ctx.setTextAlign('center')
    ctx.setTextBaseline('middle')
    ctx.fillText(rate + '%', centerX, centerY)
    ctx.draw()
  },

  goToCalendar() {
    wx.switchTab({ url: '/pages/calendar/calendar' })
  },

  loadWeeklyData() {
    const tasks = wx.getStorageSync('taskList') || []
    const recycleBin = wx.getStorageSync('recycleBin') || []
    const allTasks = [...tasks, ...recycleBin]
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay() + 1)

    const weeklyData = []
    const dayNames = ['一', '二', '三', '四', '五', '六', '日']

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      const dateStr = this.formatDate(date)

      const dayTasks = allTasks.filter(t => t.date === dateStr)
      const completed = dayTasks.filter(t => t.completed).length
      const percent = dayTasks.length > 0 ? Math.round((completed / dayTasks.length) * 100) : 0

      weeklyData.push({ day: dayNames[i], percent })
    }

    this.setData({ weeklyData })
  },

  loadStudyGoal() {
    const goal = wx.getStorageSync('studyGoal') || {
      dailyDuration: 180,
      types: [],
      deadline: '',
      checkInRecords: []
    }
    const today = this.formatDate(new Date())
    const todayCheckedIn = goal.checkInRecords && goal.checkInRecords.includes(today)
    
    this.setData({ 
      studyGoal: goal,
      todayCheckedIn: todayCheckedIn
    })
  },

  isCustomType(type) {
    const { defaultGoalTypes } = this.data
    return !defaultGoalTypes.includes(type)
  },

  removeGoalTypeFromDisplay(e) {
    const type = e.currentTarget.dataset.type
    wx.showModal({
      title: '确认移除',
      content: `确定要移除"${type}"这个学习目标类型吗？`,
      success: (res) => {
        if (res.confirm) {
          let studyGoal = { ...this.data.studyGoal }
          if (studyGoal.types) {
            studyGoal.types = studyGoal.types.filter(t => t !== type)
            this.setData({ studyGoal })
            wx.setStorageSync('studyGoal', studyGoal)
            wx.showToast({ title: '已移除', icon: 'success' })
          }
        }
      }
    })
  },

  checkInToday() {
    const today = this.formatDate(new Date())
    let studyGoal = { ...this.data.studyGoal }
    if (!studyGoal.checkInRecords) {
      studyGoal.checkInRecords = []
    }
    
    if (!studyGoal.checkInRecords.includes(today)) {
      studyGoal.checkInRecords.push(today)
      wx.setStorageSync('studyGoal', studyGoal)
      this.setData({ 
        studyGoal: studyGoal,
        todayCheckedIn: true
      })
      wx.showToast({ title: '打卡成功！', icon: 'success' })
    } else {
      wx.showToast({ title: '今天已经打卡过了', icon: 'none' })
    }
  },

  showGoalModal() {
    this.setData({ 
      showGoalModal: true,
      customDuration: '',
      customGoalType: ''
    })
    this.updateSelectedTypesList()
  },

  closeGoalModal() {
    this.setData({ showGoalModal: false })
  },

  setDuration(e) {
    const value = parseInt(e.currentTarget.dataset.value)
    let studyGoal = { ...this.data.studyGoal }
    studyGoal.dailyDuration = value
    this.setData({ studyGoal, customDuration: '' })
  },

  onCustomDurationInput(e) {
    const value = e.detail.value
    this.setData({ customDuration: value })
    if (value && parseInt(value) > 0) {
      let studyGoal = { ...this.data.studyGoal }
      studyGoal.dailyDuration = parseInt(value)
      this.setData({ studyGoal })
    }
  },

  toggleGoalType(e) {
    const type = e.currentTarget.dataset.type
    let studyGoal = { ...this.data.studyGoal }
    if (!studyGoal.types) studyGoal.types = []
    
    if (studyGoal.types.includes(type)) {
      studyGoal.types = studyGoal.types.filter(t => t !== type)
    } else {
      studyGoal.types.push(type)
    }
    this.setData({ studyGoal })
    this.updateSelectedTypesList()
  },

  updateSelectedTypesList() {
    const { studyGoal } = this.data
    const types = studyGoal.types || []
    this.setData({ selectedTypesList: types })
  },

  onCustomGoalTypeInput(e) {
    this.setData({ customGoalType: e.detail.value })
  },

  addCustomGoalType() {
    const { customGoalType, studyGoal, defaultGoalTypes } = this.data
    if (!customGoalType.trim()) {
      wx.showToast({ title: '请输入目标类型', icon: 'none' })
      return
    }
    if (studyGoal.types && studyGoal.types.includes(customGoalType.trim())) {
      wx.showToast({ title: '该类型已选择', icon: 'none' })
      return
    }
    
    let newGoal = { ...studyGoal }
    if (!newGoal.types) newGoal.types = []
    newGoal.types.push(customGoalType.trim())
    this.setData({ 
      studyGoal: newGoal,
      customGoalType: ''
    })
    this.updateSelectedTypesList()
    wx.showToast({ title: '添加成功', icon: 'success' })
  },

  removeCustomGoalType(e) {
    const type = e.currentTarget.dataset.type
    let studyGoal = { ...this.data.studyGoal }
    if (studyGoal.types) {
      studyGoal.types = studyGoal.types.filter(t => t !== type)
      this.setData({ studyGoal })
      this.updateSelectedTypesList()
      wx.showToast({ title: '已移除', icon: 'none' })
    }
  },

  onDeadlineChange(e) {
    let studyGoal = { ...this.data.studyGoal }
    studyGoal.deadline = e.detail.value
    this.setData({ studyGoal })
  },

  saveGoal() {
    wx.setStorageSync('studyGoal', this.data.studyGoal)
    this.setData({ showGoalModal: false })
    wx.showToast({ title: '目标已保存', icon: 'success' })
  },

  editSelfAnalysis() {
    const strengths = this.data.selfAnalysis.strengths.join('\n')
    const weaknesses = this.data.selfAnalysis.weaknesses.join('\n')
    
    wx.showModal({
      title: '编辑自我分析',
      editable: true,
      placeholderText: `优势（每行一个）：\n${strengths}\n\n改进（每行一个）：\n${weaknesses}`,
      success: (res) => {
        if (res.confirm && res.content) {
          const content = res.content
          const sections = content.split('\n\n')
          let newStrengths = []
          let newWeaknesses = []
          
          if (sections.length >= 2) {
            const strengthsSection = sections[0].replace(/^优势（每行一个）：\s*/, '')
            const weaknessesSection = sections[1].replace(/^改进（每行一个）：\s*/, '')
            newStrengths = strengthsSection.split('\n').filter(line => line.trim())
            newWeaknesses = weaknessesSection.split('\n').filter(line => line.trim())
          } else {
            newStrengths = content.split('\n').filter(line => line.trim())
          }
          
          const newAnalysis = { strengths: newStrengths, weaknesses: newWeaknesses }
          wx.setStorageSync('selfAnalysis', newAnalysis)
          this.setData({ selfAnalysis: newAnalysis })
          wx.showToast({ title: '保存成功', icon: 'success' })
          this.generateSuggestions()
        }
      }
    })
  },

  addStrength() {
    wx.showModal({
      title: '添加优势',
      editable: true,
      placeholderText: '请输入您的优势',
      success: (res) => {
        if (res.confirm && res.content.trim()) {
          const strengths = [...this.data.selfAnalysis.strengths, res.content.trim()]
          const newAnalysis = { ...this.data.selfAnalysis, strengths }
          wx.setStorageSync('selfAnalysis', newAnalysis)
          this.setData({ selfAnalysis: newAnalysis })
          wx.showToast({ title: '添加成功', icon: 'success' })
          this.generateSuggestions()
        }
      }
    })
  },

  addWeakness() {
    wx.showModal({
      title: '添加改进项',
      editable: true,
      placeholderText: '请输入需要改进的方面',
      success: (res) => {
        if (res.confirm && res.content.trim()) {
          const weaknesses = [...this.data.selfAnalysis.weaknesses, res.content.trim()]
          const newAnalysis = { ...this.data.selfAnalysis, weaknesses }
          wx.setStorageSync('selfAnalysis', newAnalysis)
          this.setData({ selfAnalysis: newAnalysis })
          wx.showToast({ title: '添加成功', icon: 'success' })
          this.generateSuggestions()
        }
      }
    })
  },

  editAnalysisItem(e) {
    const type = e.currentTarget.dataset.type
    const index = parseInt(e.currentTarget.dataset.index)
    const item = this.data.selfAnalysis[type][index]
    
    wx.showModal({
      title: type === 'strengths' ? '编辑优势' : '编辑改进项',
      editable: true,
      placeholderText: '请输入内容',
      value: item,
      success: (res) => {
        if (res.confirm && res.content.trim()) {
          const newList = [...this.data.selfAnalysis[type]]
          newList[index] = res.content.trim()
          const newAnalysis = { ...this.data.selfAnalysis, [type]: newList }
          wx.setStorageSync('selfAnalysis', newAnalysis)
          this.setData({ selfAnalysis: newAnalysis })
          wx.showToast({ title: '修改成功', icon: 'success' })
          this.generateSuggestions()
        }
      }
    })
  },

  deleteAnalysisItem(e) {
    e.stopPropagation()
    const type = e.currentTarget.dataset.type
    const index = parseInt(e.currentTarget.dataset.index)
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这项吗？',
      success: (res) => {
        if (res.confirm) {
          const newList = this.data.selfAnalysis[type].filter((_, i) => i !== index)
          const newAnalysis = { ...this.data.selfAnalysis, [type]: newList }
          wx.setStorageSync('selfAnalysis', newAnalysis)
          this.setData({ selfAnalysis: newAnalysis })
          wx.showToast({ title: '删除成功', icon: 'success' })
          this.generateSuggestions()
        }
      }
    })
  },

  preventClose() {},

  showTimeSlotModal() {
    this.setData({ showTimeSlotModal: true })
  },

  closeTimeSlotModal() {
    this.setData({ showTimeSlotModal: false })
  },

  toggleTimeSlot(e) {
    const period = e.currentTarget.dataset.period
    let timeSegments = this.data.timeSegments.map(s => 
      s.period === period ? { ...s, selected: !s.selected } : s
    )
    this.setData({ timeSegments })
  },

  saveTimeSlots() {
    const userPreferredSlots = this.data.timeSegments.filter(s => s.selected).map(s => s.period)
    wx.setStorageSync('userPreferredSlots', userPreferredSlots)
    this.setData({ userPreferredSlots, showTimeSlotModal: false })
    this.analyzeEfficiency()
    wx.showToast({ title: '保存成功', icon: 'success' })
  },

  analyzeBehaviorPatterns(tasks) {
    const today = this.formatDate(new Date())
    const patterns = {
      completionStreak: this.calculateCompletionStreak(tasks),
      weeklyPattern: this.analyzeWeeklyPattern(tasks),
      timeDistribution: this.analyzeTimeDistribution(tasks),
      categoryAnalysis: this.analyzeTaskCategories(tasks),
      difficultyPattern: this.analyzeDifficultyPattern(tasks)
    }
    return patterns
  },

  calculateCompletionStreak(tasks) {
    const today = new Date()
    let streak = 0
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(checkDate.getDate() - i)
      const dateStr = this.formatDate(checkDate)
      const dayTasks = tasks.filter(t => t.date === dateStr)
      const completed = dayTasks.filter(t => t.completed).length
      const total = dayTasks.length
      
      if (total > 0 && completed / total >= 0.5) {
        streak++
      } else if (i > 0) {
        break
      }
    }
    
    return streak
  },

  analyzeWeeklyPattern(tasks) {
    const weekDays = ['日', '一', '二', '三', '四', '五', '六']
    const pattern = weekDays.map((day, index) => {
      const dayTasks = tasks.filter(t => {
        const date = new Date(t.date)
        return date.getDay() === index
      })
      const completed = dayTasks.filter(t => t.completed).length
      const total = dayTasks.length
      return { day, rate: total > 0 ? Math.round((completed / total) * 100) : 0, count: total }
    })
    
    const bestDay = pattern.reduce((max, d) => d.rate > max.rate ? d : max, pattern[0])
    const worstDay = pattern.reduce((min, d) => d.rate < min.rate && d.count > 0 ? d : min, pattern[0])
    
    return { pattern, bestDay, worstDay }
  },

  analyzeTimeDistribution(tasks) {
    const periods = ['早晨', '上午', '中午', '下午', '傍晚', '晚上']
    const distribution = periods.map(period => {
      const periodTasks = tasks.filter(t => {
        const deadline = t.deadline || ''
        const match = deadline.match(/ (\d{2}):/)
        if (!match) return false
        const hour = parseInt(match[1])
        if (period === '早晨') return hour >= 6 && hour < 9
        if (period === '上午') return hour >= 9 && hour < 12
        if (period === '中午') return hour >= 12 && hour < 14
        if (period === '下午') return hour >= 14 && hour < 17
        if (period === '傍晚') return hour >= 17 && hour < 19
        return hour >= 19 || hour < 6
      })
      const completed = periodTasks.filter(t => t.completed).length
      const total = periodTasks.length
      return { period, rate: total > 0 ? Math.round((completed / total) * 100) : 0, count: total }
    })
    
    const mostProductive = distribution.reduce((max, p) => p.rate > max.rate && p.count > 0 ? p : max, distribution[0])
    const leastProductive = distribution.reduce((min, p) => p.rate < min.rate && p.count > 0 ? p : min, distribution[0])
    
    return { distribution, mostProductive, leastProductive }
  },

  analyzeTaskCategories(tasks) {
    const categories = {
      study: { completed: 0, total: 0 },
      work: { completed: 0, total: 0 },
      life: { completed: 0, total: 0 },
      exercise: { completed: 0, total: 0 }
    }
    
    tasks.forEach(task => {
      const title = task.title.toLowerCase()
      let category = 'life'
      
      if (title.includes('学习') || title.includes('作业') || title.includes('考试') || title.includes('复习')) {
        category = 'study'
      } else if (title.includes('工作') || title.includes('项目') || title.includes('报告')) {
        category = 'work'
      } else if (title.includes('运动') || title.includes('健身') || title.includes('跑步')) {
        category = 'exercise'
      }
      
      categories[category].total++
      if (task.completed) categories[category].completed++
    })
    
    const result = Object.entries(categories).map(([name, data]) => ({
      name,
      rate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
      count: data.total
    }))
    
    const weakest = result.reduce((min, c) => c.rate < min.rate && c.count > 5 ? c : min, result[0])
    const strongest = result.reduce((max, c) => c.rate > max.rate && c.count > 5 ? c : max, result[0])
    
    return { categories: result, weakest, strongest }
  },

  analyzeDifficultyPattern(tasks) {
    const difficulties = {
      easy: { completed: 0, total: 0, avgTime: 0 },
      medium: { completed: 0, total: 0, avgTime: 0 },
      hard: { completed: 0, total: 0, avgTime: 0 }
    }
    
    tasks.forEach(task => {
      const subtaskCount = task.subtasks?.length || 0
      const interest = task.interest || 50
      
      let difficulty = 'medium'
      if (subtaskCount <= 1 && interest > 70) difficulty = 'easy'
      else if (subtaskCount >= 3 || interest < 30) difficulty = 'hard'
      
      difficulties[difficulty].total++
      if (task.completed) difficulties[difficulty].completed++
    })
    
    return difficulties
  },

  predictTaskCompletion(task, userData) {
    const { completionStreak, weeklyPattern, timeDistribution } = userData
    
    let score = 50
    
    if (completionStreak >= 7) score += 20
    else if (completionStreak >= 3) score += 10
    
    const deadline = new Date(task.deadline)
    const dayOfWeek = deadline.getDay()
    const dayRate = weeklyPattern.pattern[dayOfWeek]?.rate || 50
    score += Math.round((dayRate - 50) / 10)
    
    const hour = deadline.getHours()
    let period = '晚上'
    if (hour >= 6 && hour < 9) period = '早晨'
    else if (hour >= 9 && hour < 12) period = '上午'
    else if (hour >= 12 && hour < 14) period = '中午'
    else if (hour >= 14 && hour < 17) period = '下午'
    else if (hour >= 17 && hour < 19) period = '傍晚'
    
    const periodRate = timeDistribution.distribution.find(p => p.period === period)?.rate || 50
    score += Math.round((periodRate - 50) / 10)
    
    if (task.priority === 'high') score += 10
    else if (task.priority === 'low') score -= 10
    
    return Math.min(100, Math.max(0, score))
  },

  predictFatigue() {
    const records = wx.getStorageSync('focusRecords') || []
    const today = new Date().toDateString()
    
    const todayRecords = records.filter(r => new Date(r.time).toDateString() === today)
    const totalMinutes = todayRecords.reduce((sum, r) => sum + r.duration, 0)
    
    const hoursSinceStart = todayRecords.length > 0 
      ? (Date.now() - new Date(todayRecords[0].time).getTime()) / (1000 * 60 * 60)
      : 0
    
    const avgBreakTime = todayRecords.length > 1 
      ? this.calculateAvgBreakTime(todayRecords)
      : 5
    
    let fatigueScore = 0
    
    if (totalMinutes >= 240) fatigueScore += 30
    else if (totalMinutes >= 180) fatigueScore += 20
    else if (totalMinutes >= 120) fatigueScore += 10
    
    if (hoursSinceStart >= 6 && avgBreakTime < 10) fatigueScore += 20
    else if (hoursSinceStart >= 4 && avgBreakTime < 8) fatigueScore += 10
    
    const recentRecords = todayRecords.slice(-3)
    const avgFocusDuration = recentRecords.length > 0
      ? recentRecords.reduce((sum, r) => sum + r.duration, 0) / recentRecords.length
      : 0
    
    if (avgFocusDuration < 15) fatigueScore += 20
    else if (avgFocusDuration < 20) fatigueScore += 10
    
    return {
      score: Math.min(100, fatigueScore),
      level: fatigueScore >= 70 ? 'high' : fatigueScore >= 40 ? 'medium' : 'low',
      suggestion: this.getFatigueSuggestion(fatigueScore)
    }
  },

  calculateAvgBreakTime(records) {
    if (records.length < 2) return 5
    
    let totalBreak = 0
    for (let i = 1; i < records.length; i++) {
      const prevEnd = new Date(records[i-1].time).getTime() + records[i-1].duration * 60 * 1000
      const currStart = new Date(records[i].time).getTime()
      totalBreak += (currStart - prevEnd) / (1000 * 60)
    }
    
    return Math.round(totalBreak / (records.length - 1))
  },

  getFatigueSuggestion(score) {
    if (score >= 70) return '您已经学习了很长时间，建议休息20-30分钟，可以做一些拉伸运动或喝杯茶'
    if (score >= 40) return '建议在完成当前任务后休息10-15分钟，保持良好状态'
    return '状态良好，可以继续学习'
  },

  getTimeContextSuggestion() {
    const hour = new Date().getHours()
    const tasks = wx.getStorageSync('taskList') || []
    const today = this.formatDate(new Date())
    const todayTasks = tasks.filter(t => t.date === today && !t.completed)
    
    const urgentCount = todayTasks.filter(t => {
      const deadline = new Date(t.deadline.replace(' ', 'T'))
      return deadline - Date.now() < 6 * 60 * 60 * 1000
    }).length
    
    const suggestions = []
    
    if (hour >= 6 && hour < 9) {
      if (urgentCount > 0) {
        suggestions.push({ id: 'time-1', icon: '🌅', title: '晨间高效', desc: `早上好！您有${urgentCount}个任务即将截止，建议优先处理` })
      } else {
        suggestions.push({ id: 'time-2', icon: '🌅', title: '晨间计划', desc: '早上好！建议先规划今天的学习任务，设定明确目标' })
      }
    } else if (hour >= 9 && hour < 12) {
      if (urgentCount > 0) {
        suggestions.push({ id: 'time-3', icon: '⏰', title: '专注时段', desc: `上午是高效时段，您有${urgentCount}个紧急任务，建议立即处理` })
      }
    } else if (hour >= 12 && hour < 14) {
      suggestions.push({ id: 'time-4', icon: '🍛', title: '午餐休息', desc: '建议适当休息，补充能量，下午学习效率更高' })
    } else if (hour >= 14 && hour < 17) {
      if (todayTasks.length === 0) {
        suggestions.push({ id: 'time-5', icon: '🎉', title: '任务完成', desc: '今日任务已全部完成！可以回顾总结或规划明天' })
      }
    } else if (hour >= 19 && hour < 22) {
      const completedCount = tasks.filter(t => t.date === today && t.completed).length
      suggestions.push({ id: 'time-6', icon: '📊', title: '晚间复盘', desc: `今日已完成${completedCount}个任务，建议花10分钟进行复盘总结` })
    }
    
    return suggestions
  },

  getLoadContextSuggestion(tasks) {
    const today = this.formatDate(new Date())
    const todayTasks = tasks.filter(t => t.date === today)
    const pendingTasks = todayTasks.filter(t => !t.completed)
    
    const urgentCount = pendingTasks.filter(t => {
      const deadline = new Date(t.deadline.replace(' ', 'T'))
      return deadline - Date.now() < 24 * 60 * 60 * 1000
    }).length
    
    const highPriorityCount = pendingTasks.filter(t => t.priority === 'high').length
    
    const suggestions = []
    
    if (pendingTasks.length >= 8) {
      suggestions.push({ id: 'load-1', icon: '📋', title: '任务过载', desc: '今日任务较多，建议使用艾森豪威尔矩阵进行优先级排序，先做重要紧急的' })
    } else if (urgentCount >= 3) {
      suggestions.push({ id: 'load-2', icon: '🔥', title: '紧急任务', desc: `有${urgentCount}个任务即将截止，建议优先处理这些任务` })
    } else if (highPriorityCount >= 3) {
      suggestions.push({ id: 'load-3', icon: '🎯', title: '高优先级', desc: `有${highPriorityCount}个高优先级任务，建议集中精力完成` })
    } else if (pendingTasks.length === 0) {
      suggestions.push({ id: 'load-4', icon: '✨', title: '任务完成', desc: '今日任务已全部完成！可以进行复盘或学习新技能' })
    }
    
    return suggestions
  },

  getWeaknessBasedSuggestion(weaknesses, tasks) {
    const suggestions = []
    const today = this.formatDate(new Date())
    const todayTasks = tasks.filter(t => t.date === today)
    
    weaknesses.forEach(weakness => {
      if (weakness.includes('拖延')) {
        const bigTasks = todayTasks.filter(t => t.subtasks?.length > 3)
        if (bigTasks.length > 0) {
          suggestions.push({ id: 'weak-1', icon: '🔪', title: '分解任务', desc: '检测到您有拖延倾向，建议将大任务分解为小步骤，先从最简单的开始' })
        } else {
          suggestions.push({ id: 'weak-2', icon: '🚀', title: '克服拖延', desc: '建议使用"两分钟法则"，遇到任务先做两分钟，往往就能继续下去' })
        }
      }
      
      if (weakness.includes('时间管理')) {
        const avgCompletionTime = this.calculateAvgCompletionTime(tasks)
        suggestions.push({ id: 'weak-3', icon: '⏰', title: '时间管理', desc: `根据您的记录，平均完成一个任务需要${avgCompletionTime}分钟，建议提前规划时间分配` })
      }
      
      if (weakness.includes('容易分心')) {
        const focusRecords = wx.getStorageSync('focusRecords') || []
        const avgDuration = focusRecords.length > 0 
          ? Math.round(focusRecords.reduce((sum, r) => sum + r.duration, 0) / focusRecords.length)
          : 25
        
        if (avgDuration < 20) {
          suggestions.push({ id: 'weak-4', icon: '🧘', title: '提升专注', desc: `平均专注时长${avgDuration}分钟，建议开启专注模式，逐步延长专注时间` })
        } else {
          suggestions.push({ id: 'weak-5', icon: '🔇', title: '减少干扰', desc: '建议学习时关闭手机通知，使用专注音乐提升专注度' })
        }
      }
      
      if (weakness.includes('计划')) {
        suggestions.push({ id: 'weak-6', icon: '📝', title: '制定计划', desc: '建议每晚花5分钟制定第二天的学习计划，明确目标更易执行' })
      }
    })
    
    return suggestions
  },

  calculateAvgCompletionTime(tasks) {
    const completedTasks = tasks.filter(t => t.completed && t.completedTime && t.createTime)
    if (completedTasks.length === 0) return 45
    
    const totalMinutes = completedTasks.reduce((sum, t) => {
      return sum + (t.completedTime - t.createTime) / (1000 * 60)
    }, 0)
    
    return Math.round(totalMinutes / completedTasks.length)
  },

  getGoalOrientedSuggestion(goal, tasks) {
    if (!goal || !goal.dailyDuration) return []
    
    const suggestions = []
    const checkInRecords = goal.checkInRecords || []
    const today = this.formatDate(new Date())
    const hasCheckedIn = checkInRecords.includes(today)
    
    const totalDays = goal.deadline ? this.calculateDaysLeft(goal.deadline) : 30
    const completedDays = checkInRecords.length
    
    if (!hasCheckedIn) {
      suggestions.push({ id: 'goal-1', icon: '✅', title: '今日打卡', desc: '今日还未打卡，建议完成学习后进行打卡记录' })
    }
    
    if (totalDays > 0) {
      const progressRate = completedDays / totalDays
      const expectedRate = (30 - totalDays + 1) / 30
      
      if (progressRate < expectedRate * 0.8) {
        suggestions.push({ id: 'goal-2', icon: '⏰', title: '进度提醒', desc: `距离目标还有${totalDays}天，当前进度稍慢，建议适当增加学习时间` })
      } else if (progressRate > expectedRate * 1.2) {
        suggestions.push({ id: 'goal-3', icon: '🌟', title: '进度超前', desc: `进度良好！已完成${completedDays}天打卡，继续保持` })
      }
    }
    
    const focusRecords = wx.getStorageSync('focusRecords') || []
    const todayFocusMinutes = focusRecords
      .filter(r => new Date(r.time).toDateString() === new Date().toDateString())
      .reduce((sum, r) => sum + r.duration, 0)
    
    const dailyGoal = goal.dailyDuration
    if (todayFocusMinutes < dailyGoal * 0.5) {
      suggestions.push({ id: 'goal-4', icon: '📚', title: '学习时长', desc: `今日已学习${todayFocusMinutes}分钟，距离每日目标${dailyGoal}分钟还有差距` })
    } else if (todayFocusMinutes >= dailyGoal) {
      suggestions.push({ id: 'goal-5', icon: '🎉', title: '完成目标', desc: `今日学习时长${todayFocusMinutes}分钟，已达到每日目标！` })
    }
    
    return suggestions
  },

  calculateDaysLeft(deadline) {
    const deadlineDate = new Date(deadline)
    const today = new Date()
    const diff = deadlineDate - today
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  },

  recordSuggestionFeedback(suggestionId, action) {
    const feedbacks = wx.getStorageSync('suggestionFeedbacks') || []
    feedbacks.push({
      suggestionId,
      action,
      timestamp: Date.now(),
      date: this.formatDate(new Date())
    })
    wx.setStorageSync('suggestionFeedbacks', feedbacks)
  },

  onSuggestionFeedback(e) {
    const suggestionId = e.currentTarget.dataset.id
    const action = e.currentTarget.dataset.action
    
    this.recordSuggestionFeedback(suggestionId, action)
    
    if (action === 'useful') {
      wx.showToast({ title: '感谢反馈！', icon: 'success', duration: 1500 })
    }
    
    const suggestions = this.data.suggestions.map(s => {
      if (s.id === suggestionId) {
        return { ...s, feedbacked: true }
      }
      return s
    })
    this.setData({ suggestions })
  },

  getFeedbackOptimizedSuggestions(baseSuggestions) {
    const feedbacks = wx.getStorageSync('suggestionFeedbacks') || []
    const feedbackCount = {}
    
    feedbacks.forEach(f => {
      const id = f.suggestionId
      feedbackCount[id] = feedbackCount[id] || { viewed: 0, useful: 0, dismissed: 0 }
      if (f.action === 'viewed') feedbackCount[id].viewed++
      else if (f.action === 'useful') feedbackCount[id].useful++
      else if (f.action === 'dismissed') feedbackCount[id].dismissed++
    })
    
    return baseSuggestions.map(s => {
      const feedback = feedbackCount[s.id]
      if (feedback) {
        const usefulRate = feedback.viewed > 0 ? feedback.useful / feedback.viewed : 0.5
        return { ...s, confidence: Math.round(usefulRate * 100) }
      }
      return { ...s, confidence: 50 }
    }).sort((a, b) => b.confidence - a.confidence)
  },

  generateSuggestions() {
    const tasks = wx.getStorageSync('taskList') || []
    const analysis = wx.getStorageSync('selfAnalysis') || { strengths: [], weaknesses: [] }
    const reflections = wx.getStorageSync('taskReflections') || []
    const studyGoal = wx.getStorageSync('studyGoal') || {}
    
    const behaviorPatterns = this.analyzeBehaviorPatterns(tasks)
    const fatiguePrediction = this.predictFatigue()
    
    const allSuggestions = []
    
    allSuggestions.push(...this.getTimeContextSuggestion())
    allSuggestions.push(...this.getLoadContextSuggestion(tasks))
    allSuggestions.push(...this.getWeaknessBasedSuggestion(analysis.weaknesses, tasks))
    allSuggestions.push(...this.getGoalOrientedSuggestion(studyGoal, tasks))
    
    if (behaviorPatterns.completionStreak >= 7) {
      allSuggestions.push({ id: 'pattern-1', icon: '🔥', title: '连续打卡', desc: `已连续完成${behaviorPatterns.completionStreak}天任务，保持这个势头！` })
    } else if (behaviorPatterns.completionStreak === 0 && tasks.filter(t => t.date === this.formatDate(new Date())).length > 0) {
      allSuggestions.push({ id: 'pattern-2', icon: '💪', title: '开始行动', desc: '今天还没有完成任务，开始第一个任务吧！' })
    }
    
    if (behaviorPatterns.weeklyPattern.worstDay && behaviorPatterns.weeklyPattern.worstDay.rate < 40) {
      const dayNames = { '一': '周一', '二': '周二', '三': '周三', '四': '周四', '五': '周五', '六': '周六', '日': '周日' }
      allSuggestions.push({ id: 'pattern-3', icon: '📈', title: '周规律', desc: `${dayNames[behaviorPatterns.weeklyPattern.worstDay.day]}是您的薄弱日，建议提前规划，适当减少任务量` })
    }
    
    if (behaviorPatterns.timeDistribution.leastProductive && behaviorPatterns.timeDistribution.leastProductive.rate < 30) {
      allSuggestions.push({ id: 'pattern-4', icon: '⏳', title: '时间优化', desc: `${behaviorPatterns.timeDistribution.leastProductive.period}效率较低，建议将简单任务安排在此时段` })
    }
    
    if (behaviorPatterns.categoryAnalysis.weakest && behaviorPatterns.categoryAnalysis.weakest.rate < 50) {
      const categoryNames = { study: '学习', work: '工作', life: '生活', exercise: '运动' }
      allSuggestions.push({ id: 'pattern-5', icon: '🎯', title: '分类提升', desc: `${categoryNames[behaviorPatterns.categoryAnalysis.weakest.name]}类任务完成率较低，建议加强这方面的管理` })
    }
    
    if (fatiguePrediction.level !== 'low') {
      allSuggestions.push({ id: 'fatigue-1', icon: '😴', title: '休息建议', desc: fatiguePrediction.suggestion })
    }
    
    if (reflections.length > 0) {
      const recentReflections = reflections.slice(-5)
      const difficultyCount = recentReflections.filter(r => r.type === 'difficulty').length
      const timeIssueCount = recentReflections.filter(r => r.type === 'time').length
      const successCount = recentReflections.filter(r => r.type === 'success').length
      
      if (difficultyCount >= 2) {
        allSuggestions.push({ id: 'reflection-1', icon: '💡', title: '难点突破', desc: '最近多个任务遇到困难，建议放慢速度，先复习相关知识点再继续' })
      } else if (timeIssueCount >= 2) {
        allSuggestions.push({ id: 'reflection-2', icon: '⏳', title: '时间管理', desc: '时间安排问题出现较多，可以尝试提前规划任务时间，预留缓冲时间' })
      } else if (successCount >= 3) {
        allSuggestions.push({ id: 'reflection-3', icon: '🚀', title: '状态提升', desc: '状态很棒！可以尝试增加一点难度，挑战更高的目标' })
      }
    }
    
    const today = this.formatDate(new Date())
    const todayTasks = tasks.filter(t => t.date === today)
    const completedToday = todayTasks.filter(t => t.completed).length
    const totalToday = todayTasks.length
    const todayRate = totalToday > 0 ? (completedToday / totalToday) * 100 : 0
    
    if (todayRate >= 80 && totalToday >= 3) {
      allSuggestions.push({ id: 'daily-1', icon: '🎉', title: '今日出色', desc: '今日完成率超过80%，继续保持高效的学习节奏！' })
    }
    
    const optimizedSuggestions = this.getFeedbackOptimizedSuggestions(allSuggestions)
    const uniqueSuggestions = optimizedSuggestions.filter((s, index, self) => 
      index === self.findIndex(t => t.id === s.id)
    )
    
    const finalSuggestions = uniqueSuggestions.length > 0 
      ? uniqueSuggestions.slice(0, 4)
      : [{ id: 'default-1', icon: '📚', title: '今日学习', desc: '今天也是充满挑战的一天，加油！' }]
    
    this.setData({ suggestions: finalSuggestions })
  },

  addReflection(e) {
    const taskId = e.currentTarget.dataset.taskId
    const tasks = wx.getStorageSync('taskList') || []
    const task = tasks.find(t => t.id === taskId)
    
    wx.showActionSheet({
      itemList: ['任务完成顺利', '任务有难度', '时间安排不合理', '其他'],
      success: (res) => {
        const types = ['success', 'difficulty', 'time', 'other']
        const type = types[res.tapIndex]
        const isOther = res.tapIndex === 3
        
        if (isOther) {
          wx.showModal({
            title: '添加反思',
            editable: true,
            placeholderText: '请输入反思内容',
            success: (modalRes) => {
              if (modalRes.confirm && modalRes.content) {
                this.saveReflection(taskId, task?.title || '未知任务', type, modalRes.content.trim())
              }
            }
          })
        } else {
          const typeDescriptions = ['任务完成得很好，继续保持！', '遇到了一些难点，需要针对性练习。', '时间安排可以再优化一下。']
          this.saveReflection(taskId, task?.title || '未知任务', type, typeDescriptions[res.tapIndex])
        }
      }
    })
  },

  saveReflection(taskId, taskTitle, type, content) {
    const reflections = wx.getStorageSync('taskReflections') || []
    reflections.push({
      id: Date.now(),
      taskId,
      taskTitle,
      type,
      content,
      time: new Date().toISOString()
    })
    wx.setStorageSync('taskReflections', reflections)
    
    let tasks = wx.getStorageSync('taskList') || []
    const task = tasks.find(t => t.id === taskId)
    if (task) {
      const completedTask = { ...task, completed: true, completedTime: Date.now() }
      let recycleBin = wx.getStorageSync('recycleBin') || []
      recycleBin.push(completedTask)
      wx.setStorageSync('recycleBin', recycleBin)
      tasks = tasks.filter(t => t.id !== taskId)
      wx.setStorageSync('taskList', tasks)
    }
    
    wx.showToast({ title: '反思已记录，任务已移至回收站', icon: 'success' })
    this.loadTasks()
    this.generateSuggestions()
    this.drawPieChart()
    this.loadWeeklyData()
  },

  loadSelfAnalysis() {
    const analysis = wx.getStorageSync('selfAnalysis') || { strengths: [], weaknesses: [] }
    this.setData({ selfAnalysis: analysis })
  }
})