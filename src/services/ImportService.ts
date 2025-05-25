import { disableCache } from "@/utils"
import { parseFile } from "./parser"
import { booksStore, chapterListStore, contentStore, readingStateStore } from "./storage"

const parseFileName = (url: string) => {
  const { pathname } = new URL(url)
  const fileName = pathname.split('/').pop()
  if (fileName) {
    return decodeURIComponent(fileName)
  }
  return 'unknown'
}

export const importFile = async (
  file: File,
  meta?: Partial<IRemoteBook>,
  onUpdate?: (progress: number) => void
) => {
  onUpdate?.(0)
  const result = await parseFile(file)
  onUpdate?.(25)
  const { content, maxCursor, chapterList } = result
  const title = meta?.title || result.title
  const cover = meta?.cover || result.cover
  const onlineBookId = meta?.id
  const info = { title, cover, onlineBookId, maxCursor, tocRegList: meta?.tocRegList }
  const bookId = await booksStore.add(info)
  onUpdate?.(50)
  await Promise.all([
    contentStore.add({ bookId: bookId, content }),
    chapterListStore.add({ bookId: bookId, chapterList }),
    // 设置一下最后阅读时间，确保新导入或新下载的这本书位于书架第一个
    readingStateStore.update(String(bookId), { lastReadTime: Date.now() })
  ]).catch(err => {
    booksStore.remove(bookId)
    contentStore.remove(bookId)
    chapterListStore.remove(bookId)
    throw err
  })
  onUpdate?.(100)
  return { ...result, ...info, id: bookId}
}

export const download = async (downloadUrl: string, meta?: Partial<IRemoteBook>, onUpdate?: (progress: number) => void) => {
  onUpdate?.(0)
  const r = await fetch(disableCache(downloadUrl))
  onUpdate?.(25)
  const blob = await r.blob()
  onUpdate?.(50)
  const file = new File([blob], parseFileName(downloadUrl))
  return importFile(
    file,
    {
      ...meta,
      id: meta?.id || downloadUrl
    },
    (progress) => {
      onUpdate?.(50 + 50 * progress / 100)
    }
  )
}
