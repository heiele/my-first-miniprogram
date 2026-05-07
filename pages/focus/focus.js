// pages/focus/focus.js
Page({
  data: {
    currentMode: 'pomodoro',
    modeSettings: {
      pomodoro: { duration: 25 * 60, label: '专注时间' },
      shortBreak: { duration: 5 * 60, label: '短休息' },
      longBreak: { duration: 15 * 60, label: '长休息' }
    },
    timeLeft: 25 * 60,
    isRunning: false,
    formattedTime: '25:00',
    modeLabel: '专注时间',
    progressDegrees: 0,
    completedPomodoros: 3,
    totalFocusTime: '1h 15m',
    streakDays: 7,
    sessionHistory: [
      { time: '09:00', duration: '25分钟', type: 'pomodoro' },
      { time: '09:25', duration: '5分钟', type: 'break' },
      { time: '09:30', duration: '25分钟', type: 'pomodoro' },
      { time: '09:55', duration: '5分钟', type: 'break' },
      { time: '10:00', duration: '25分钟', type: 'pomodoro' }
    ],
    timer: null
  },

  onLoad() {
    this.updateFormattedTime()
    this.loadFocusStatistics()
  },

  onShow() {
    this.loadFocusStatistics()
  },

  loadFocusStatistics() {
    const focusRecords = wx.getStorageSync('focusRecords') || []
    const today = this.formatDate(new Date())
    const todayRecords = focusRecords.filter(r => r.date === today && r.mode === 'pomodoro')
    const completedPomodoros = todayRecords.length
    
    const totalMinutes = todayRecords.reduce((sum, r) => sum + r.duration, 0)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    
    let totalFocusTime = ''
    if (hours > 0) {
      totalFocusTime += hours + 'h '
    }
    totalFocusTime += minutes + 'm'
    
    const streakDays = this.calculateStreakDays(focusRecords)
    
    this.setData({ 
      completedPomodoros, 
      totalFocusTime,
      streakDays 
    })
  },

  calculateStreakDays(focusRecords) {
    if (!focusRecords || focusRecords.length === 0) return 0
    
    const pomodoroRecords = focusRecords.filter(r => r.mode === 'pomodoro')
    if (pomodoroRecords.length === 0) return 0
    
    const dates = [...new Set(pomodoroRecords.map(r => r.date))].sort().reverse()
    
    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    for (let i = 0; i < dates.length; i++) {
      const recordDate = new Date(dates[i])
      recordDate.setHours(0, 0, 0, 0)
      const expectedDate = new Date(today)
      expectedDate.setDate(expectedDate.getDate() - i)
      
      if (recordDate.getTime() === expectedDate.getTime()) {
        streak++
      } else {
        break
      }
    }
    
    return streak
  },

  onUnload() {
    this.stopTimer()
  },

  switchMode(e) {
    const mode = e.currentTarget ? e.currentTarget.dataset.mode : e
    
    if (this.data.isRunning) {
      wx.showToast({
        title: '请先停止计时器',
        icon: 'none'
      })
      return
    }
    
    const settings = this.data.modeSettings[mode]
    this.setData({
      currentMode: mode,
      timeLeft: settings.duration,
      modeLabel: settings.label
    })
    this.updateFormattedTime()
    this.updateProgress()
  },

  updateFormattedTime() {
    const minutes = Math.floor(this.data.timeLeft / 60)
    const seconds = this.data.timeLeft % 60
    const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    this.setData({ formattedTime: formatted })
  },

  updateProgress() {
    const total = this.data.modeSettings[this.data.currentMode].duration
    const progress = ((total - this.data.timeLeft) / total) * 360
    this.setData({ progressDegrees: progress })
  },

  toggleTimer() {
    if (this.data.isRunning) {
      this.stopTimer()
    } else {
      this.startTimer()
    }
  },

  startTimer() {
    this.setData({ isRunning: true })
    
    this.data.timer = setInterval(() => {
      if (this.data.timeLeft > 0) {
        this.setData({ timeLeft: this.data.timeLeft - 1 })
        this.updateFormattedTime()
        this.updateProgress()
      } else {
        this.completeSession()
      }
    }, 1000)
  },

  stopTimer() {
    if (this.data.timer) {
      clearInterval(this.data.timer)
      this.data.timer = null
    }
    this.setData({ isRunning: false })
  },

  resetTimer() {
    this.stopTimer()
    const settings = this.data.modeSettings[this.data.currentMode]
    this.setData({
      timeLeft: settings.duration,
      progressDegrees: 0
    })
    this.updateFormattedTime()
  },

  skipTimer() {
    this.completeSession()
  },

  completeSession() {
    this.stopTimer()
    
    if (this.data.currentMode === 'pomodoro') {
      this.setData({
        completedPomodoros: this.data.completedPomodoros + 1
      })
      
      const now = new Date()
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      const newHistory = [...this.data.sessionHistory, {
        time: timeStr,
        duration: '25分钟',
        type: 'pomodoro'
      }]
      this.setData({ sessionHistory: newHistory })

      this.recordFocusSession(25)

      if (this.data.completedPomodoros % 4 === 0) {
        this.switchMode('longBreak')
      } else {
        this.switchMode('shortBreak')
      }
    } else {
      this.switchMode('pomodoro')
    }

    wx.showToast({
      title: this.data.currentMode === 'pomodoro' ? '🍅 完成一个番茄！' : '休息结束！',
      icon: 'none'
    })
  },

  recordFocusSession(duration) {
    const focusRecords = wx.getStorageSync('focusRecords') || []
    focusRecords.push({
      time: new Date().toISOString(),
      duration: duration,
      mode: this.data.currentMode,
      date: this.formatDate(new Date())
    })
    wx.setStorageSync('focusRecords', focusRecords)
    
    this.updateTotalFocusTime()
  },

  formatDate(date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return y + '-' + m + '-' + d
  },

  updateTotalFocusTime() {
    const focusRecords = wx.getStorageSync('focusRecords') || []
    const today = this.formatDate(new Date())
    const todayRecords = focusRecords.filter(r => r.date === today && r.mode === 'pomodoro')
    const totalMinutes = todayRecords.reduce((sum, r) => sum + r.duration, 0)
    
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    
    let totalFocusTime = ''
    if (hours > 0) {
      totalFocusTime += hours + 'h '
    }
    totalFocusTime += minutes + 'm'
    
    this.setData({ totalFocusTime })
  }
})