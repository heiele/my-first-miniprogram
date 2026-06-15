// utils/api.js
// 后端 API 封装

// 后端服务器地址
// 开发环境使用本地地址，生产环境需要修改为实际服务器地址
const BASE_URL = 'http://localhost:3000/api'

// 用户 ID（可以从小程序获取 openid）
const getUserId = () => {
  return wx.getStorageSync('userId') || 'default'
}

// 通用请求方法
const request = (url, method = 'GET', data = {}) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE_URL + url,
      method,
      data: { ...data, userId: getUserId() },
      header: {
        'Content-Type': 'application/json'
      },
      success: (res) => {
        if (res.data.success) {
          resolve(res.data.data)
        } else {
          reject(new Error(res.data.error || '请求失败'))
        }
      },
      fail: (err) => {
        console.error('API请求失败:', err)
        reject(err)
      }
    })
  })
}

// ==================== 任务相关 API ====================

const taskApi = {
  // 获取所有任务
  getAll: () => request('/tasks'),
  
  // 获取今日任务
  getToday: () => request('/tasks/today'),
  
  // 获取单个任务
  getOne: (id) => request(`/tasks/${id}`),
  
  // 创建任务
  create: (data) => request('/tasks', 'POST', data),
  
  // 更新任务
  update: (id, data) => request(`/tasks/${id}`, 'PUT', data),
  
  // 完成任务
  complete: (id) => request(`/tasks/${id}/complete`, 'PUT'),
  
  // 删除任务
  delete: (id) => request(`/tasks/${id}`, 'DELETE'),
  
  // 批量删除过期任务
  deleteExpired: () => request('/tasks/expired/batch', 'DELETE')
}

// ==================== 用户相关 API ====================

const userApi = {
  // 获取用户信息
  getInfo: () => request(`/users/${getUserId()}`),
  
  // 更新用户信息
  update: (data) => request(`/users/${getUserId()}`, 'PUT', data),
  
  // 获取统计数据
  getStats: () => request(`/users/${getUserId()}/stats`),
  
  // 获取学习目标
  getGoal: () => request(`/users/${getUserId()}/goal`),
  
  // 保存学习目标
  saveGoal: (data) => request(`/users/${getUserId()}/goal`, 'POST', data),
  
  // 打卡
  checkin: () => request(`/users/${getUserId()}/checkin`, 'POST')
}

// ==================== 专注记录 API ====================

const focusApi = {
  // 获取专注记录
  getAll: (limit = 50) => request(`/tasks?limit=${limit}`),
  
  // 获取今日统计
  getToday: () => request('/focus/today'),
  
  // 获取周统计
  getWeekly: () => request('/focus/weekly'),
  
  // 创建专注记录
  create: (data) => request('/focus', 'POST', data),
  
  // 删除专注记录
  delete: (id) => request(`/focus/${id}`, 'DELETE')
}

// ==================== 习惯打卡 API ====================

const habitApi = {
  // 获取习惯列表
  getAll: () => request('/habits'),
  
  // 创建习惯
  create: (data) => request('/habits', 'POST', data),
  
  // 获取打卡记录
  getCheckins: (habitId) => request(`/habits/${habitId}/checkins`),
  
  // 打卡
  checkin: (habitId) => request(`/habits/${habitId}/checkin`, 'POST'),
  
  // 删除习惯
  delete: (habitId) => request(`/habits/${habitId}`, 'DELETE')
}

// ==================== 数据同步 ====================

const syncApi = {
  // 从本地存储同步到后端
  syncToServer: async () => {
    try {
      // 同步任务
      const tasks = wx.getStorageSync('taskList') || []
      for (const task of tasks) {
        await taskApi.create(task)
      }
      
      // 同步专注记录
      const focusRecords = wx.getStorageSync('focusRecords') || []
      for (const record of focusRecords) {
        await focusApi.create(record)
      }
      
      console.log('数据同步成功')
      return true
    } catch (err) {
      console.error('数据同步失败:', err)
      return false
    }
  },
  
  // 从后端同步到本地
  syncFromServer: async () => {
    try {
      const tasks = await taskApi.getAll()
      wx.setStorageSync('taskList', tasks)
      
      const focusRecords = await focusApi.getAll()
      wx.setStorageSync('focusRecords', focusRecords)
      
      console.log('数据拉取成功')
      return true
    } catch (err) {
      console.error('数据拉取失败:', err)
      return false
    }
  }
}

module.exports = {
  taskApi,
  userApi,
  focusApi,
  habitApi,
  syncApi,
  getUserId
}
