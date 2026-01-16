import { type Progress, default as db } from './db.js';

export const getProgress = (username: string, document: string) => {
  return db.data.progress.find(progress => progress.document === document && progress.username === username)
}

export const updateProgress = async (username: string, document: string, progress: Progress) => {
  db.data.progress = db.data.progress.map(item => {
    if (item.document === document && item.username === username) {
      return { ...progress, username, document }
    }
    return item
  })
  await db.write()
}
