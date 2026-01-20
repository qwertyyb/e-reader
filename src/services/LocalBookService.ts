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

  async getBook(id: string) {
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
  async getChapterContent(bookId: string, chapter: IChapter): Promise<string> {
    const result = await contentStore.get(Number(bookId))
    return result.content.split('\n').slice(chapter.cursorStart, chapter.cursorEnd! + 1).join('\n')
  }
}

export const localBookService = new LocalBookService()
