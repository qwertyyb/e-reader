import type { IBookService } from "./IBookService"
import { booksStore, chapterListStore, contentStore } from "./storage"

const render = async (chapterId: string, content: string, chapterIndex: number, startCursor: number, endCursor?: number) => {
  const chapterEl = document.createElement('div')
  chapterEl.classList.add('chapter')
  chapterEl.dataset.id = chapterId
  chapterEl.dataset.chapterIndex = JSON.stringify(chapterIndex)
  let chapterTextOffset = 0
  content.split('\n').slice(startCursor, endCursor).forEach((line, i) => {
    const str = line.trim()
    if (i === 0) {
      const h4 = document.createElement('h4')
      h4.dataset.chapterIndex = JSON.stringify(chapterIndex)
      h4.dataset.cursor = JSON.stringify(startCursor + i)
      h4.dataset.chapterTextOffset = chapterTextOffset.toString()
      h4.classList.add('chapter-title')
      h4.textContent = str
      chapterEl.appendChild(h4)
    } else {
      const p = document.createElement('p')
      p.dataset.cursor = JSON.stringify(startCursor + i)
      p.dataset.chapterTextOffset = chapterTextOffset.toString()
      p.textContent = str
      chapterEl.appendChild(p)
    }
    chapterTextOffset += str.length
  })

  // chapterEl = await renderMarks(book.id, chapter.id, chapterEl)

  return chapterEl.outerHTML
}

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
  async getChapter(bookId: string, chapterId: string, chapterIndex: number): Promise<string> {
    const result = await contentStore.get(Number(bookId))
    const text = result.content
    const chapter = await chapterListStore.get(Number(bookId))
    const chapterList = chapter.chapterList
    const next = chapterIndex < chapterList.length - 1 ? chapterList[chapterIndex + 1] : undefined
    return render(chapterId, text, chapterIndex, Number(chapterId), next ? Number(next.id) : undefined)
  }
}

export const localBookService = new LocalBookService()
