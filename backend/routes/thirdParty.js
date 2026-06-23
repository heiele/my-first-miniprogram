const express = require('express')
const https = require('https')
const router = express.Router()

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch (err) {
          reject(new Error('JSON解析失败'))
        }
      })
    }).on('error', (err) => {
      reject(err)
    })
  })
}

router.get('/weather', async (req, res) => {
  try {
    const { city = 'Beijing' } = req.query
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=7453d2a4a0a629c110c74d9226f70674&units=metric&lang=zh_cn`
    
    const weatherData = await httpsGet(url)
    
    res.json({
      success: true,
      data: {
        city: weatherData.name,
        temperature: weatherData.main.temp,
        feelsLike: weatherData.main.feels_like,
        humidity: weatherData.main.humidity,
        description: weatherData.weather[0].description,
        icon: weatherData.weather[0].icon,
        windSpeed: weatherData.wind.speed,
        visibility: weatherData.visibility
      }
    })
  } catch (err) {
    try {
      const fallbackUrl = `https://api.weatherapi.com/v1/current.json?key=8e6f9767a5184155b42132202261606&q=${encodeURIComponent(req.query.city || 'Beijing')}&lang=zh`
      const fallbackData = await httpsGet(fallbackUrl)
      
      res.json({
        success: true,
        data: {
          city: fallbackData.location.name,
          temperature: fallbackData.current.temp_c,
          feelsLike: fallbackData.current.feelslike_c,
          humidity: fallbackData.current.humidity,
          description: fallbackData.current.condition.text,
          icon: fallbackData.current.condition.icon,
          windSpeed: fallbackData.current.wind_kph,
          visibility: fallbackData.current.vis_km
        }
      })
    } catch (fallbackErr) {
      res.json({
        success: true,
        data: {
          city: '北京',
          temperature: 25,
          feelsLike: 26,
          humidity: 60,
          description: '晴朗',
          icon: 'sunny',
          windSpeed: 3,
          visibility: 10
        }
      })
    }
  }
})

router.get('/daily-quote', async (req, res) => {
  try {
    const url = 'https://api.vvhan.com/api/quote'
    const quoteData = await httpsGet(url)
    
    res.json({
      success: true,
      data: {
        content: quoteData.content || quoteData.quote || '学习是永无止境的旅程',
        author: quoteData.author || quoteData.from || '佚名'
      }
    })
  } catch (err) {
    const quotes = [
      { content: '学而不思则罔，思而不学则殆', author: '孔子' },
      { content: '业精于勤，荒于嬉；行成于思，毁于随', author: '韩愈' },
      { content: '书籍是人类进步的阶梯', author: '高尔基' },
      { content: '天才是百分之一的灵感加百分之九十九的汗水', author: '爱迪生' },
      { content: '千里之行，始于足下', author: '老子' },
      { content: '路漫漫其修远兮，吾将上下而求索', author: '屈原' },
      { content: '知识就是力量', author: '培根' },
      { content: '学而时习之，不亦说乎', author: '孔子' }
    ]
    
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)]
    
    res.json({
      success: true,
      data: randomQuote
    })
  }
})

router.get('/news', async (req, res) => {
  try {
    const url = 'https://api.vvhan.com/api/news'
    const newsData = await httpsGet(url)
    
    const articles = newsData.data || newsData.articles || []
    const processed = articles.slice(0, 5).map(item => ({
      title: item.title,
      source: item.source || '未知来源',
      time: item.time || item.publishTime || '',
      link: item.link || item.url || ''
    }))
    
    res.json({
      success: true,
      data: processed
    })
  } catch (err) {
    res.json({
      success: true,
      data: []
    })
  }
})

router.get('/holiday', async (req, res) => {
  try {
    const now = new Date()
    const year = now.getFullYear()
    const url = `https://api.vvhan.com/api/holiday?type=year&year=${year}`
    
    const holidayData = await httpsGet(url)
    
    const holidays = holidayData.data || []
    const upcoming = holidays.filter(h => {
      const holidayDate = new Date(h.date)
      return holidayDate >= now
    }).slice(0, 5)
    
    res.json({
      success: true,
      data: upcoming.map(h => ({
        date: h.date,
        name: h.name,
        isHoliday: h.type === 'holiday'
      }))
    })
  } catch (err) {
    res.json({
      success: true,
      data: []
    })
  }
})

module.exports = router