import { parseFile } from "./parser"
import { booksStore, chapterListStore, contentStore } from "./storage"

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
  meta: Partial<IRemoteBook>,
  onUpdate?: (progress: number) => void
) => {
  onUpdate?.(0)
  const result = await parseFile(file)
  onUpdate?.(25)
  const { content, maxCursor, chapterList } = result
  const title = meta.title || result.title
  const cover = meta.cover || result.cover
  const onlineBookId = meta.id
  const info = { title, cover, onlineBookId, maxCursor, tocRegList: meta.tocRegList }
  const bookId = await booksStore.add(info)
  onUpdate?.(50)
  await Promise.all([
    contentStore.add({ bookId: bookId, content }),
    chapterListStore.add({ bookId: bookId, chapterList })
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
  const r = await fetch(downloadUrl)
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
