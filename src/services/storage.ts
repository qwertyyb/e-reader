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
  },
  ({ database }) => {
    database.createObjectStore('content', { keyPath: 'bookId' })
  },
  ({ database }) => {
    database.createObjectStore('chapterList', { keyPath: 'bookId' })
  },
  ({ transaction }) => {
    transaction!.objectStore('books').createIndex('onlineBookId', 'onlineBookId')
  },
  ({ database }) => {
    const keywordsStore = database.createObjectStore('keywords', { keyPath: 'id', autoIncrement: true })
    keywordsStore.createIndex('bookId', 'bookId')
  },
  ({ transaction }) => {
    transaction!.objectStore('keywords').createIndex('bookIdAndKeyword', ['bookId', 'keyword'], { unique: true })
  },
  ({ database }) => {
    const readingStateStore = database.createObjectStore('readingState', { keyPath: 'bookId' })
    readingStateStore.createIndex('bookId', 'bookId')
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

const createStore = <E, I extends IDBKeyRange | IDBValidKey = number>(storeName: string, {
  keyPath = 'id',
}: {
  keyPath?: string
} = {}) => {
  return {
    add(info: Partial<E>) {
      return wrap(db =>
        db.transaction([storeName], 'readwrite')
          .objectStore(storeName)
          .add(info)
      )
    },
    getList(): Promise<E[]> {
      return wrap(db =>
        db.transaction(storeName)
          .objectStore(storeName)
          .getAll()
      )

    },
    get (id: I): Promise<Required<E>> {
      return wrap(db =>
        db.transaction(storeName)
          .objectStore(storeName)
          .get(id)
      )
    },
    remove (id: I) {
      return wrap(db =>
        db.transaction([storeName], 'readwrite')
          .objectStore(storeName)
          .delete(id)
      )
    },
    async update (id: I, updatedData: Partial<E>) {
      const data = await this.get(id)
      return wrap(db =>
        db.transaction([storeName], 'readwrite')
          .objectStore(storeName)
          .put({ ...data, ...updatedData, [keyPath]: id })
      )
    }
  }
}

export const booksStore = createStore<ILocalBook>('books')

interface IContent {
  bookId: number
  content: string
}
export const contentStore = createStore<IContent>('content')

interface IChapterEntity {
  bookId: number
  chapterList: IChapter[]
}
export const chapterListStore = createStore<IChapterEntity>('chapterList')

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

export const keywordsStore = (() => {
  const store = createStore<IKeyword>('keywords')
  return {
    ...store,
    async getListByBookId(bookId: number): Promise<IKeyword[]> {
      return wrap(db =>
        db.transaction('keywords')
          .objectStore('keywords')
          .index('bookId')
          .getAll(bookId)
      )
    },
    async removeAllByBookId(bookId: number) {
      const list = await this.getListByBookId(bookId)
      const transaction = db!.transaction(['keywords'], 'readwrite')
      const store = transaction.objectStore('keywords')
      await Promise.all(list.map(item => {
        return new Promise((resolve, reject) => {
          const request = store.delete(item.id)
          request.onsuccess = () => resolve(request.result)
          request.onerror = () => reject(request.error)
        })
      }))
    },
    async updateLastUsedAt(id: number) {
      const keyword = await store.get(id)
      if (keyword) {
        await store.update(id, {
          lastUsedAt: new Date().toISOString()
        })
      }
    }
  }
})()

export const readingStateStore = createStore<IReadingState, string>('readingState', { keyPath: 'bookId' })
