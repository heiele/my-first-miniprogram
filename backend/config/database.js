const path = require('path')
const fs = require('fs')

const dataDir = path.join(__dirname, '../data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, 'miniapp.json')

let db = {
  users: [],
  tasks: [],
  subtasks: [],
  focus_records: [],
  habits: [],
  habit_checkins: [],
  study_goals: [],
  goal_checkins: []
}

function loadDatabase() {
  if (fs.existsSync(dbPath)) {
    try {
      const content = fs.readFileSync(dbPath, 'utf8')
      db = JSON.parse(content)
    } catch (err) {
      console.error('数据库加载失败，使用空数据库:', err.message)
    }
  }
  console.log('✅ 数据库加载完成')
}

function saveDatabase() {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2))
}

function initDatabase() {
  loadDatabase()
  console.log('✅ 数据库初始化完成')
}

function query(tableName, condition = () => true) {
  const table = db[tableName] || []
  return Promise.resolve(table.filter(condition))
}

function get(tableName, condition = () => true) {
  const table = db[tableName] || []
  return Promise.resolve(table.find(condition))
}

function run(sql, params = []) {
  try {
    if (sql.startsWith('INSERT INTO')) {
      const match = sql.match(/INSERT INTO (\w+) \(([^)]+)\) VALUES \(([^)]+)\)/)
      if (match) {
        const tableName = match[1]
        const columns = match[2].split(',').map(c => c.trim())
        const values = match[3].split(',').map((v, i) => {
          if (v === '?') return params[i]
          if (v.startsWith("'") && v.endsWith("'")) return v.slice(1, -1)
          if (!isNaN(v)) return parseInt(v) || parseFloat(v)
          return v
        })
        
        const record = {}
        columns.forEach((col, i) => {
          record[col] = values[i]
        })
        
        if (!db[tableName]) db[tableName] = []
        db[tableName].push(record)
        saveDatabase()
        return Promise.resolve({ lastID: record.id || db[tableName].length, changes: 1 })
      }
    } else if (sql.startsWith('UPDATE')) {
      const tableMatch = sql.match(/UPDATE (\w+)/)
      const setMatch = sql.match(/SET ([^WHERE]+)/)
      const whereMatch = sql.match(/WHERE (\w+) = \?/)
      
      if (tableMatch && setMatch && whereMatch) {
        const tableName = tableMatch[1]
        const whereCol = whereMatch[1]
        const whereValue = params[params.length - 1]
        
        const setParts = setMatch[1].split(',').map(p => p.trim())
        const updates = {}
        let paramIndex = 0
        
        setParts.forEach(part => {
          const [key, value] = part.split('=').map(p => p.trim())
          if (value === '?') {
            updates[key] = params[paramIndex++]
          } else if (value === 'COALESCE(?, ?)') {
            const newValue = params[paramIndex++]
            const defaultValue = params[paramIndex++]
            if (newValue !== null && newValue !== undefined) {
              updates[key] = newValue
            } else {
              updates[key] = defaultValue
            }
          } else if (value.startsWith("'") && value.endsWith("'")) {
            updates[key] = value.slice(1, -1)
          } else if (!isNaN(value)) {
            updates[key] = parseInt(value) || parseFloat(value)
          } else {
            updates[key] = value
          }
        })
        
        if (!db[tableName]) db[tableName] = []
        const records = db[tableName]
        let changes = 0
        
        records.forEach(record => {
          if (record[whereCol] === whereValue) {
            Object.assign(record, updates)
            changes++
          }
        })
        
        saveDatabase()
        return Promise.resolve({ changes })
      }
    } else if (sql.startsWith('DELETE')) {
      const tableMatch = sql.match(/DELETE FROM (\w+)/)
      const whereMatch = sql.match(/WHERE (\w+) = \?/)
      
      if (tableMatch && whereMatch) {
        const tableName = tableMatch[1]
        const whereCol = whereMatch[1]
        const whereValue = params[0]
        
        if (!db[tableName]) db[tableName] = []
        const originalLength = db[tableName].length
        db[tableName] = db[tableName].filter(r => r[whereCol] !== whereValue)
        const changes = originalLength - db[tableName].length
        
        saveDatabase()
        return Promise.resolve({ changes })
      }
    } else if (sql.startsWith('SELECT')) {
      const tableMatch = sql.match(/FROM (\w+)/)
      if (tableMatch) {
        const tableName = tableMatch[1]
        if (!db[tableName]) db[tableName] = []
        return Promise.resolve(db[tableName])
      }
    }
    
    saveDatabase()
    return Promise.resolve({ changes: 0 })
  } catch (err) {
    return Promise.reject(err)
  }
}

module.exports = { db, initDatabase, query, get, run }