import { type Progress, default as db } from './db.js';

export const getProgress = (username: string, document: string) => {
  return db.data.progress.find(progress => progress.document === document && progress.username === username)
}

export const updateProgress = async (username: string, document: string, progress: Progress) => {
  const existsIndex = db.data.progress.findIndex(i => i.username === username && i.document === document)
  if (existsIndex >= 0) {
    db.data.progress.splice(existsIndex, 1, { ...progress, username, document })
  } else {
    db.data.progress.unshift({ ...progress, username, document })
  }
  await db.write()
}
