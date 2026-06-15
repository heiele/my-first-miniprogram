// pages/auth/auth.js
Page({
  data: {},

  onLoad() {
    this.checkAuth()
  },
  
  checkAuth() {
    try {
      const authorized = wx.getStorageSync('authorized')
      if (authorized) {
        // 使用 setTimeout 延迟跳转，避免与页面加载冲突
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/index/index',
            fail: (err) => {
              console.error('switchTab failed:', err)
            }
          })
        }, 300)
      }
    } catch (e) {
      console.error('checkAuth error:', e)
    }
  },

  onAuthAgree(e) {
    try {
      if (e.detail.errMsg === 'getUserInfo:ok') {
        const userInfo = e.detail.userInfo
        wx.setStorageSync('authorized', true)
        wx.setStorageSync('nickName', userInfo.nickName)
        wx.setStorageSync('avatarUrl', userInfo.avatarUrl)
      } else {
        wx.setStorageSync('authorized', true)
      }
      
      // 延迟跳转
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/index/index',
          fail: (err) => {
            console.error('switchTab failed:', err)
          }
        })
      }, 300)
    } catch (e) {
      console.error('onAuthAgree error:', e)
    }
  },

  onAuthDisagree() {
    wx.showModal({
      title: '提示',
      content: '拒绝授权将无法使用小程序功能，确定要退出吗？',
      confirmText: '再想想',
      cancelText: '确定退出',
      success(res) {
        if (!res.confirm) {
          wx.exitMiniProgram()
        }
      }
    })
  }
})