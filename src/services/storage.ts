type TMigration = (options: { database: IDBDatabase, transaction: IDBTransaction | null }) => void

const databaseName = 'books'
// 数据库迁移脚本，只可增加，不可修改，不可删除
const migrations: TMigration[] = [
  ({ database }) => {
    const objectStore = database.createObjectStore('books', { keyPath: 'id', autoIncrement: true })
    objectStore.createIndex('title', 'title', { unique: true })
  },
  ({ database }) => {
    const objectStore = database.createObjectStore('marks', { keyPath: 'id', autoIncrement: true })
    objectStore.createIndex('bookId', 'bookId', { unique: false })
    objectStore.createIndex('chapter', ['bookId', 'chapterId'], { unique: false })
  }
]
const version = migrations.length

let db: IDBDatabase | null = null

const getDatabase = () => {
  if (db) return db
  return new Promise((resolve) => {
    const request = window.indexedDB.open(databaseName, version);

    request.onerror = () => {
      console.error('open indexedDB error')
    }

    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      console.log('onUpgrade', event)
      db = request.result
      const { oldVersion } = event
      for(let i = oldVersion; i < migrations.length; i += 1) {
        migrations[i]({ database: db, transaction: request.transaction })
      }
    }
  })
}

const wrap = async <R>(func: (db: IDBDatabase) => IDBRequest<R>) => {
  await getDatabase()
  return new Promise<R>((resolve, reject) => {
    const request = func(db!)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

const createStore = <E>(storeName: string) => {
  return {
    add(info: Partial<E>) {
      return wrap(db =>
        db.transaction([storeName], 'readwrite')
          .objectStore(storeName)
          .add(info)
      )
    },
    getList () {
      return wrap(db =>
        db.transaction(storeName)
          .objectStore(storeName)
          .getAll()
      )
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        .then(list => (list as (E & { content: string })[]).map(({ content, ...rest }) => rest))

    },
    get (id: number): Promise<Required<E>> {
      return wrap(db =>
        db.transaction(storeName)
          .objectStore(storeName)
          .get(id)
      )
    },
    remove (id: number) {
      return wrap(db =>
        db.transaction([storeName], 'readwrite')
          .objectStore(storeName)
          .delete(id)
      )
    },
    update (id: number, updatedData: Partial<E>) {
      return wrap(db =>
        db.transaction([storeName], 'readwrite')
          .objectStore(storeName)
          .put({ ...updatedData, id })
      )
    }
  }
}

export const books = (() => {
  const baseBooks = createStore<IBookEntity>('books')
  return {
    ...baseBooks,
    async updateLastReadTime(id: number) {
      const data = await baseBooks.get(id)
      const lastReadTime = Date.now()
      data.lastReadTime = lastReadTime
      return baseBooks.update(id, data)
    }
  }
})()

export const marks = (() => {
  const baseMarks = createStore<IMarkEntity>('marks')
  return {
    ...baseMarks,
    async getListByChapterAndBook(bookId: number, chapterId: number) {
      const list = await baseMarks.getList()
      return list.filter(item => {
        return item.bookId === bookId && item.chapterId === chapterId
      })
    },
    async getListByBook(bookId: number) {
      const list = await baseMarks.getList()
      return list.filter(item => item.bookId === bookId)
        .sort((a, b) => {
          return a.chapterId - b.chapterId || a.range.start - b.range.start
        })
    }
  }
})()
