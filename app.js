// app.js
App({
  onLaunch() {
    // 不在这里做页面跳转，让页面自己处理
    console.log('App launched')
  },
  
  globalData: {
    userInfo: null,
    themeConfig: {
      primary: '#4A90D9',
      bg: '#f5f6f8',
      text: '#333',
      card: '#fff',
      accent: '#4A90D9'
    }
  }
})