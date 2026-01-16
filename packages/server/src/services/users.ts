import crypto from 'node:crypto'
import db from './db.js'

export const createUser = async (username: string, password: string) => {
  // 先检查用户是否存在
  const exists = db.data.users.find(user => user.username === username)
  if (exists) {
    throw new Error('User already exists')
  }
  db.data.users.push({
    username,
    password: crypto.createHash('sha256').update(password).digest('hex')
  })
  await db.write()
}

export const authUser = (username: string, password: string) => {
  const hash = crypto.createHash('sha256').update(password).digest('hex')
  const user = db.data.users.find(user => user.username === username && user.password === hash)
  if (!user) {
    throw new Error('Invalid username or password')
  }
  return username
}
