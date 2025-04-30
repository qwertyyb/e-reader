import type { IBookService } from "./IBookService"
import { booksStore, chapterListStore, contentStore } from "./storage"

export class LocalBookService implements IBookService {
  async getBookList(): Promise<ILocalBook[]> {
    return booksStore.getList().then(list => {
      return list.map(item => {
        return {
          ...item,
          id: item.id.toString(),
        }
      })
    })
  }

  async getBook(id: string): Promise<ILocalBook> {
    return booksStore.get(Number(id)).then(item => {
      return {
        ...item,
        id: item.id.toString(),
      }
    })
  }

  async getChapterList(bookId: string): Promise<IChapter[]> {
    return chapterListStore.get(Number(bookId)).then(result => result.chapterList)
  }
  async getChapter(bookId: string): Promise<string> {
    const result = await contentStore.get(Number(bookId))
    const text = result.content
    return text
  }
}

export const localBookService = new LocalBookService()
