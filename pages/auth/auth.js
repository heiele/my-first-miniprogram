// pages/auth/auth.js
Page({
  data: {},

  onAuthAgree(e) {
    if (e.detail.errMsg === 'getUserInfo:ok') {
      const userInfo = e.detail.userInfo
      wx.setStorageSync('authorized', true)
      wx.setStorageSync('nickName', userInfo.nickName)
      wx.setStorageSync('avatarUrl', userInfo.avatarUrl)
      wx.switchTab({
        url: '/pages/index/index'
      })
    } else {
      wx.setStorageSync('authorized', true)
      wx.switchTab({
        url: '/pages/index/index'
      })
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