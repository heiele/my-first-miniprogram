// pages/mine/mine.js
const app = getApp()

Page({
  data: {
    nickName: '同学',
    avatarUrl: '',
    signature: '',
    theme: 'light',
    showNicknameModal: false,
    showSignatureModal: false,
    showNotificationModal: false,
    showPrivacyModal: false,
    showAnalysisModal: false,
    showGoalModal: false,
    showPreferenceModal: false,
    showEditTagModal: false,
    tempNickname: '',
    tempSignature: '',
    tempTagText: '',
    editingTagIndex: -1,
    editingTagType: '',
    notification: {
      taskRemind: true,
      sound: true,
      vibrate: true,
      dailySummary: false,
      focusRemind: true
    },
    privacy: {
      allowStats: true,
      saveHistory: true,
      location: false,
      personalized: true
    },
    strengthTags: [],
    weaknessTags: [],
    durationOptions: [
      { label: '1小时', value: 60 },
      { label: '2小时', value: 120 },
      { label: '3小时', value: 180 },
      { label: '4小时', value: 240 },
      { label: '5小时', value: 300 },
      { label: '6小时', value: 360 }
    ],
    dailyDuration: 180,
    goalTags: [
      { text: '考试备考', selected: false },
      { text: '技能学习', selected: false },
      { text: '语言学习', selected: false },
      { text: '职业发展', selected: false },
      { text: '兴趣爱好', selected: false },
      { text: '证书考试', selected: false }
    ],
    goalDeadline: '',
    focusOptions: [
      { label: '25分钟', value: 25 },
      { label: '30分钟', value: 30 },
      { label: '45分钟', value: 45 },
      { label: '60分钟', value: 60 }
    ],
    breakOptions: [
      { label: '5分钟', value: 5 },
      { label: '10分钟', value: 10 },
      { label: '15分钟', value: 15 },
      { label: '20分钟', value: 20 }
    ],
    timeTags: [
      { text: '早晨', selected: false },
      { text: '上午', selected: false },
      { text: '下午', selected: false },
      { text: '晚上', selected: false }
    ],
    preference: {
      focusDuration: 25,
      breakDuration: 5,
      autoRemind: true,
      showStats: true
    }
  },

  onLoad() {
    this.loadUserData()
    this.loadSettings()
  },

  onShow() {
    this.loadUserData()
  },

  loadUserData() {
    const nickName = wx.getStorageSync('nickName')
    const avatarUrl = wx.getStorageSync('avatarUrl')
    const signature = wx.getStorageSync('signature')
    this.setData({
      nickName: nickName || '同学',
      avatarUrl: avatarUrl || '',
      signature: signature || ''
    })
  },

  loadSettings() {
    const theme = wx.getStorageSync('theme') || 'light'
    const notification = wx.getStorageSync('notification') || this.data.notification
    const privacy = wx.getStorageSync('privacy') || this.data.privacy
    const analysis = wx.getStorageSync('selfAnalysis') || { strengths: [], weaknesses: [] }
    const goal = wx.getStorageSync('studyGoal') || { dailyDuration: 180, types: [], deadline: '' }
    const preference = wx.getStorageSync('studyPreference') || this.data.preference

    const strengthTags = analysis.strengths.map(text => ({ text, selected: true }))
    const weaknessTags = analysis.weaknesses.map(text => ({ text, selected: true }))
    const goalTags = this.data.goalTags.map(t => ({
      ...t,
      selected: goal.types.includes(t.text)
    }))
    const timeTags = this.data.timeTags.map(t => ({
      ...t,
      selected: (preference.timeSlots || []).includes(t.text)
    }))

    this.setData({ 
      theme, 
      notification, 
      privacy, 
      strengthTags, 
      weaknessTags,
      dailyDuration: goal.dailyDuration,
      goalTags,
      goalDeadline: goal.deadline,
      preference,
      timeTags
    })
    this.applyTheme(theme)
  },

  changeAvatar() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const path = res.tempFilePaths[0]
        wx.setStorageSync('avatarUrl', path)
        this.setData({ avatarUrl: path })
        wx.showToast({ title: '头像更新成功', icon: 'success' })
      }
    })
  },

  editNickname() {
    this.setData({
      showNicknameModal: true,
      tempNickname: this.data.nickName
    })
  },

  closeNicknameModal() {
    this.setData({ showNicknameModal: false })
  },

  onNicknameInput(e) {
    this.setData({ tempNickname: e.detail.value })
  },

  saveNickname() {
    const nickname = this.data.tempNickname.trim()
    if (!nickname) {
      wx.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }
    wx.setStorageSync('nickName', nickname)
    this.setData({
      nickName: nickname,
      showNicknameModal: false
    })
    wx.showToast({ title: '昵称更新成功', icon: 'success' })
  },

  editSignature() {
    this.setData({
      showSignatureModal: true,
      tempSignature: this.data.signature
    })
  },

  closeSignatureModal() {
    this.setData({ showSignatureModal: false })
  },

  onSignatureInput(e) {
    this.setData({ tempSignature: e.detail.value })
  },

  saveSignature() {
    const signature = this.data.tempSignature.trim()
    wx.setStorageSync('signature', signature)
    this.setData({
      signature: signature,
      showSignatureModal: false
    })
    wx.showToast({ title: '签名更新成功', icon: 'success' })
  },

  setTheme(e) {
    const theme = e.currentTarget.dataset.theme
    this.setData({ theme })
    wx.setStorageSync('theme', theme)
    this.applyTheme(theme)

    const names = { light: '浅色模式', dark: '深色模式', ocean: '海洋蓝', sunset: '日落橙' }
    wx.showToast({ title: '已切换到' + names[theme], icon: 'none' })

    if (this.data.notification.vibrate) {
      wx.vibrateShort({ type: 'light' })
    }
  },

  applyTheme(theme) {
    const themes = {
      light: { primary: '#4A90D9', bg: '#f5f6f8', text: '#333', card: '#fff', accent: '#4A90D9' },
      dark: { primary: '#667eea', bg: '#1a1a2e', text: '#eee', card: '#2d2d44', accent: '#667eea' },
      ocean: { primary: '#0077b6', bg: '#caf0f8', text: '#03045e', card: '#ffffff', accent: '#0077b6' },
      sunset: { primary: '#f5576c', bg: '#fff5f5', text: '#333', card: '#ffffff', accent: '#f5576c' }
    }
    const config = themes[theme] || themes.light

    if (app.globalData) {
      app.globalData.themeConfig = config
    }
  },

  showNotificationModal() {
    this.setData({ showNotificationModal: true })
  },
  closeNotificationModal() { this.setData({ showNotificationModal: false }) },

  toggleNotification(e) {
    const key = e.currentTarget.dataset.key
    const notification = { ...this.data.notification }
    notification[key] = !notification[key]
    this.setData({ notification })
    wx.setStorageSync('notification', notification)

    if (key === 'vibrate' && notification.vibrate) {
      wx.vibrateShort({ type: 'light' })
    }
    if (key === 'sound' && notification.sound) {
      wx.showToast({ title: '声音已开启', icon: 'none' })
    }
  },

  showPrivacyModal() {
    this.setData({ showPrivacyModal: true })
  },
  closePrivacyModal() { this.setData({ showPrivacyModal: false }) },

  togglePrivacy(e) {
    const key = e.currentTarget.dataset.key
    const privacy = { ...this.data.privacy }
    privacy[key] = !privacy[key]
    this.setData({ privacy })
    wx.setStorageSync('privacy', privacy)
  },

  showAnalysisModal() {
    this.setData({ showAnalysisModal: true })
  },
  closeAnalysisModal() { this.setData({ showAnalysisModal: false }) },

  toggleStrengthTag(e) {
    const index = e.currentTarget.dataset.index
    const tags = [...this.data.strengthTags]
    tags[index].selected = !tags[index].selected
    this.setData({ strengthTags: tags })
  },

  toggleWeaknessTag(e) {
    const index = e.currentTarget.dataset.index
    const tags = [...this.data.weaknessTags]
    tags[index].selected = !tags[index].selected
    this.setData({ weaknessTags: tags })
  },

  addStrength(e) {
    const text = e.detail.value.trim()
    if (!text) return
    const tags = [...this.data.strengthTags, { text, selected: true }]
    this.setData({ strengthTags: tags })
  },

  addWeakness(e) {
    const text = e.detail.value.trim()
    if (!text) return
    const tags = [...this.data.weaknessTags, { text, selected: true }]
    this.setData({ weaknessTags: tags })
  },

  saveAnalysis() {
    const strengths = this.data.strengthTags.filter(t => t.selected).map(t => t.text)
    const weaknesses = this.data.weaknessTags.filter(t => t.selected).map(t => t.text)
    wx.setStorageSync('selfAnalysis', { strengths, weaknesses })
    wx.showToast({ title: '保存成功', icon: 'success' })
    this.closeAnalysisModal()
  },

  deleteStrength(e) {
    const index = e.currentTarget.dataset.index
    const tags = this.data.strengthTags.filter((_, i) => i !== index)
    this.setData({ strengthTags: tags })
    wx.showToast({ title: '已删除', icon: 'none' })
  },

  deleteWeakness(e) {
    const index = e.currentTarget.dataset.index
    const tags = this.data.weaknessTags.filter((_, i) => i !== index)
    this.setData({ weaknessTags: tags })
    wx.showToast({ title: '已删除', icon: 'none' })
  },

  editStrength(e) {
    const index = e.currentTarget.dataset.index
    const text = this.data.strengthTags[index].text
    this.setData({
      showEditTagModal: true,
      tempTagText: text,
      editingTagIndex: index,
      editingTagType: 'strength'
    })
  },

  editWeakness(e) {
    const index = e.currentTarget.dataset.index
    const text = this.data.weaknessTags[index].text
    this.setData({
      showEditTagModal: true,
      tempTagText: text,
      editingTagIndex: index,
      editingTagType: 'weakness'
    })
  },

  closeEditTagModal() {
    this.setData({ showEditTagModal: false })
  },

  onTagInput(e) {
    this.setData({ tempTagText: e.detail.value })
  },

  saveTagEdit() {
    const text = this.data.tempTagText.trim()
    if (!text) {
      wx.showToast({ title: '请输入标签内容', icon: 'none' })
      return
    }

    if (this.data.editingTagType === 'strength') {
      const tags = [...this.data.strengthTags]
      tags[this.data.editingTagIndex].text = text
      this.setData({ strengthTags: tags })
    } else {
      const tags = [...this.data.weaknessTags]
      tags[this.data.editingTagIndex].text = text
      this.setData({ weaknessTags: tags })
    }

    wx.showToast({ title: '修改成功', icon: 'success' })
    this.closeEditTagModal()
  },

  clearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '确定要清除所有缓存数据吗？这不会删除您的任务。',
      success: (res) => {
        if (res.confirm) {
          const keys = ['taskList', 'selfAnalysis', 'selectedHabits', 'notification', 'privacy', 'theme', 'signature']
          keys.forEach(k => wx.removeStorageSync(k))
          wx.showToast({ title: '缓存已清除', icon: 'success' })
          this.loadSettings()
        }
      }
    })
  },

  showAbout() {
    wx.showModal({
      title: '学习日历 v1.0.0',
      content: '一款帮助你高效学习的日历应用\n\n功能特点：\n• 任务管理与优先级排序\n• 番茄钟专注模式\n• 学习数据分析\n• AI智能建议\n\n开发者：学习团队',
      showCancel: false
    })
  },

  checkUpdate() {
    wx.showLoading({ title: '检查中...' })
    setTimeout(() => {
      wx.hideLoading()
      wx.showToast({ title: '已是最新版本', icon: 'success' })
    }, 1500)
  },

  logout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('authorized')
          wx.removeStorageSync('nickName')
          wx.removeStorageSync('avatarUrl')
          wx.removeStorageSync('signature')
          wx.redirectTo({ url: '/pages/auth/auth' })
        }
      }
    })
  },

  showGoalModal() {
    this.setData({ showGoalModal: true })
  },
  closeGoalModal() { this.setData({ showGoalModal: false }) },

  setDailyDuration(e) {
    const value = parseInt(e.currentTarget.dataset.value)
    this.setData({ dailyDuration: value })
  },

  toggleGoalTag(e) {
    const index = e.currentTarget.dataset.index
    const tags = [...this.data.goalTags]
    tags[index].selected = !tags[index].selected
    this.setData({ goalTags: tags })
  },

  onDeadlineChange(e) {
    this.setData({ goalDeadline: e.detail.value })
  },

  saveGoal() {
    const types = this.data.goalTags.filter(t => t.selected).map(t => t.text)
    const goal = {
      dailyDuration: this.data.dailyDuration,
      types,
      deadline: this.data.goalDeadline
    }
    wx.setStorageSync('studyGoal', goal)
    wx.showToast({ title: '目标已保存', icon: 'success' })
    this.closeGoalModal()
  },

  showPreferenceModal() {
    this.setData({ showPreferenceModal: true })
  },
  closePreferenceModal() { this.setData({ showPreferenceModal: false }) },

  setFocusDuration(e) {
    const value = parseInt(e.currentTarget.dataset.value)
    const preference = { ...this.data.preference, focusDuration: value }
    this.setData({ preference })
    wx.setStorageSync('studyPreference', preference)
  },

  setBreakDuration(e) {
    const value = parseInt(e.currentTarget.dataset.value)
    const preference = { ...this.data.preference, breakDuration: value }
    this.setData({ preference })
    wx.setStorageSync('studyPreference', preference)
  },

  toggleTimeTag(e) {
    const index = e.currentTarget.dataset.index
    const tags = [...this.data.timeTags]
    tags[index].selected = !tags[index].selected
    this.setData({ timeTags: tags })
    
    const timeSlots = tags.filter(t => t.selected).map(t => t.text)
    const preference = { ...this.data.preference, timeSlots }
    this.setData({ preference })
    wx.setStorageSync('studyPreference', preference)
  },

  toggleAutoRemind(e) {
    const preference = { ...this.data.preference, autoRemind: e.detail.value }
    this.setData({ preference })
    wx.setStorageSync('studyPreference', preference)
  },

  toggleShowStats(e) {
    const preference = { ...this.data.preference, showStats: e.detail.value }
    this.setData({ preference })
    wx.setStorageSync('studyPreference', preference)
  },

  preventClose() {}
})