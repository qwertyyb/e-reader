const createLastReadBooks = () => ({
  get(bookId: number) {
    const lastReadInfo = JSON.parse(localStorage.getItem('lastReadBooks') || '{}')
    return lastReadInfo[bookId]
  },
  set(bookId: number, { catalogId, cursor }: { catalogId: number, cursor: number }) {
    const lastReadInfo = JSON.parse(localStorage.getItem('lastReadBooks') || '{}')
    lastReadInfo[bookId] = { catalogId, cursor }
    localStorage.setItem('lastReadBooks', JSON.stringify(lastReadInfo))
  }
})

const createLastReadBook = () => ({
  get() {
    try {
      return JSON.parse(localStorage.getItem('lastReadBook') || '')
    } catch {
      return null
    }
  },
  set(bookId: number) {
    return localStorage.setItem('lastReadBook', JSON.stringify({ bookId }))
  }
})

export const lastReadBooks = createLastReadBooks()

export const lastReadBook = createLastReadBook()
