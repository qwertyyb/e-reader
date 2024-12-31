import { books } from './storage'
import { parseTxtFile, download } from './txt-file'

const render = async (book: IBookEntity, chapter: { id: number }, content: string, chapterIndex: number, startCursor: number, endCursor?: number) => {
  const chapterEl = document.createElement('div')
  chapterEl.classList.add('chapter')
  chapterEl.dataset.id = chapter.id.toString()
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

export const dataService = {
  async getBookList () {
    const list = await books.getList()
    const bookList = window.remoteBooks.map(item => {
      const local = list.find(localBook => localBook.id === item.id)
      return {
        ...local,
        ...item,
        downloaded: Number(!!local),
        catalog: (local && local.catalog || []).map(item => {
          return {
            ...item,
            id: item.cursor + '',
          }
        })
      }
    }).sort((prev, next) => {
      return next.downloaded - prev.downloaded || (next.lastReadTime || 0) - (prev.lastReadTime || 0) || 0
    })
    return bookList
  },
  async removeLocalBook(book: IBookEntity) {
    return books.remove(book.id)
  },
  async downloadRemoteBook(book: IRemoteBook, onUpdate: (progress: number, total: number) => void) {
    const { id, title, cover, content, catalog } = await download(book, onUpdate)
    await books.add({ id, title, cover, content, catalog })
    return {
      id, title, cover
    }
  },
  async getCatalog (id: number) {
    const book = await books.get(id)
    const catalog = book.catalog.map(item => {
      return {
        ...item,
        id: item.cursor
      }
    })
    return catalog
  },
  async getChapter(chapter: { id: number, cursor: number }, chapterIndex: number, book: IBookEntity) {
    const { content } = await books.get(book.id)
    const index = (book.catalog || []).findIndex(item => item.cursor === chapter.cursor)
    const next = (book.catalog || [])[index + 1]
    const startCursor = chapter.cursor
    return { content: await render(book, chapter, content, chapterIndex, startCursor, next && next.cursor || undefined) }
  },
  async getBook(bookId: number) {
    return books.get(bookId)
  },
  async updateBook(bookId: number, updatedData: Partial<IBookEntity>) {
    return books.update(bookId, updatedData)
  }
}

export const importFile = async (file: File) => {
  const info = await parseTxtFile(file)
  await books.add(info)
  return info
}
