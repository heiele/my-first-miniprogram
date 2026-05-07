// index.js
Page({
  data: {
    motto: 'Hello World',
    userInfo: {
      avatarUrl: '',
      nickName: '',
    },
    hasUserInfo: false,
    showModal: false,
  },
  bindViewTap() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    this.setData({
      "userInfo.avatarUrl": avatarUrl
    })
  },
  onInputChange(e) {
    const nickName = e.detail.value
    this.setData({
      "userInfo.nickName": nickName
    })
  },
  onGetUserInfo(e) {
    if (e.detail.errMsg === 'getUserInfo:ok') {
      const userInfo = e.detail.userInfo
      this.setData({
        userInfo: {
          avatarUrl: userInfo.avatarUrl,
          nickName: userInfo.nickName
        },
        hasUserInfo: true,
        showModal: false
      })
    } else {
      this.setData({
        showModal: false
      })
    }
  },
  showLoginModal() {
    const { avatarUrl, nickName } = this.data.userInfo
    if (avatarUrl && nickName) {
      wx.showModal({
        title: '提示',
        content: '请先选择头像和输入昵称',
        showCancel: false
      })
      return
    }
    this.setData({
      showModal: true
    })
  },
  hideLoginModal() {
    this.setData({
      showModal: false
    })
  },
  preventClose() {
  },
})