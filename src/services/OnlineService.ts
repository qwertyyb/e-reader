import { decodeText, downloadWithProgress } from "@/utils"
import { booksStore, chapterListStore, contentStore } from "./storage"
import { parseChapterList } from "./txt-file"
import { parseEpubFile } from "./epub"

const download = async (downloadUrl: string, onUpdate?: (progress: number, total: number) => void) => {
  const data = await downloadWithProgress(downloadUrl, onUpdate)
  if (downloadUrl.endsWith('.txt')) {
    const content = decodeText(data.buffer)
    const chapterList = parseChapterList(content)
    return {
      content,
      maxCursor: chapterList[chapterList.length - 1].cursorEnd,
      chapterList,
    }
  }
  if (downloadUrl.endsWith('.epub')) {
    return parseEpubFile(new Blob([data.buffer]))
  }
}

export class OnlineService {
  async getBookList(): Promise<(IBook & { downloadUrl: string })[]> {
    return window.remoteBooks
  }

  async downloadBook(id: string, onUpdate: (progress: number, total: number) => void) {
    const book = window.remoteBooks.find(item => item.id === id)
    if (!book) {
      throw new Error('Book not found')
    }
    const { id: onlineBookId, title, cover, downloadUrl } = book
    const { content, chapterList, maxCursor } = await download(downloadUrl, onUpdate)
    const bookId = await booksStore.add({ title, cover, onlineBookId, maxCursor })
    await Promise.all([
      contentStore.add({ bookId: bookId as number, content }),
      chapterListStore.add({ bookId: bookId as number, chapterList })
    ]).catch(err => {
      booksStore.remove(bookId as number)
      throw err
    })
  }
}

export const onlineService = new OnlineService()
