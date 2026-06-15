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
    this.initPage()
  },
  
  async initPage() {
    try {
      await this.safeExecute('updateFormattedTime', () => this.updateFormattedTime())
    } catch (e) {
      console.error('focus page init error:', e)
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
  }
})