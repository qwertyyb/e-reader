import { JSONFilePreset } from 'lowdb/node'
import { DATABASE_PATH } from '../const.js'

type DatabaseData = {
  users: { username: string, password: string }[],
  progress: (Progress & { username: string })[]
}

export type Progress = {
  document: string,
  percentage: number,
  progress: string,
  device: string,
  deviceId: string,
  timestamp: number
}

// Read or create db.json
const defaultData: DatabaseData = {
  users: [],
  progress: []
}

const db = await JSONFilePreset<DatabaseData>(DATABASE_PATH, defaultData)

export default db
