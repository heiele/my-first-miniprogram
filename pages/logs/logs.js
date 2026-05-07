// logs.js
Page({
  data: {
    logs: []
  },
  onLoad() {
    const logs = (wx.getStorageSync('logs') || []).map(log => {
      return {
        date: new Date(log).toLocaleString(),
        timeStamp: log
      }
    })
    this.setData({
      logs: logs
    })
  }
})