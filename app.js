// app.js
App({
  onLaunch() {
    const authorized = wx.getStorageSync('authorized')
    if (authorized) {
      wx.switchTab({
        url: '/pages/index/index'
      })
    }
  },
  globalData: {
    userInfo: null
  }
})