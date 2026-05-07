const app = getApp()

Page({
  data: {
    recycleList: [],
    theme: 'light'
  },

  onLoad() {
    const theme = wx.getStorageSync('theme') || 'light'
    this.setData({ theme })
    this.loadRecycleBin()
  },

  onShow() {
    const theme = wx.getStorageSync('theme') || 'light'
    this.setData({ theme })
    this.loadRecycleBin()
  },

  loadRecycleBin() {
    const recycleBin = wx.getStorageSync('recycleBin') || []
    const sorted = [...recycleBin].sort((a, b) => b.completedTime - a.completedTime)
    this.setData({ recycleList: sorted })
  },

  formatTime(timestamp) {
    const date = new Date(timestamp)
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    const h = String(date.getHours()).padStart(2, '0')
    const min = String(date.getMinutes()).padStart(2, '0')
    return `${y}-${m}-${d} ${h}:${min}`
  },

  restoreTask(e) {
    const id = e.currentTarget.dataset.id
    let recycleBin = wx.getStorageSync('recycleBin') || []
    const task = recycleBin.find(t => t.id === id)
    if (task) {
      let tasks = wx.getStorageSync('taskList') || []
      tasks.push({ ...task, completed: false, completedTime: null })
      recycleBin = recycleBin.filter(t => t.id !== id)
      wx.setStorageSync('taskList', tasks)
      wx.setStorageSync('recycleBin', recycleBin)
      wx.showToast({ title: '已恢复', icon: 'success' })
      this.loadRecycleBin()
    }
  },

  deleteTask(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除',
      content: '删除后将无法恢复，确定要删除吗？',
      success: (res) => {
        if (res.confirm) {
          let recycleBin = wx.getStorageSync('recycleBin') || []
          recycleBin = recycleBin.filter(t => t.id !== id)
          wx.setStorageSync('recycleBin', recycleBin)
          wx.showToast({ title: '删除成功', icon: 'success' })
          this.loadRecycleBin()
        }
      }
    })
  },

  clearAll() {
    wx.showModal({
      title: '清空回收站',
      content: '清空后所有已完成任务将无法恢复，确定要清空吗？',
      success: (res) => {
        if (res.confirm) {
          wx.setStorageSync('recycleBin', [])
          wx.showToast({ title: '已清空', icon: 'success' })
          this.loadRecycleBin()
        }
      }
    })
  },

  goBack() {
    wx.navigateBack()
  }
})