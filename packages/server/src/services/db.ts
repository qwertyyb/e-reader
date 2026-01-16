import { JSONFilePreset } from 'lowdb/node'

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

const db = await JSONFilePreset<DatabaseData>('db.json', defaultData)

export default db
