// app.js
App({
  onLaunch() {
    this.initApp()
  },
  
  async initApp() {
    try {
      const authorized = wx.getStorageSync('authorized')
      if (authorized) {
        const timer = setTimeout(() => {
          console.warn('switchTab timeout, continuing')
        }, 5000)
        
        wx.switchTab({
          url: '/pages/index/index',
          success: () => clearTimeout(timer),
          fail: () => clearTimeout(timer)
        })
      }
    } catch (e) {
      console.error('app init error:', e)
    }
  },
  
  globalData: {
    userInfo: null
  }
})