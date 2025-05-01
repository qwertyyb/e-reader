interface IDownloadingStatus {
  total: number
  downloaded: number
  progress: string
}

interface IBook {
  id: string
  title: string
  cover: string
}

interface ILocalBook extends IBook {
  onlineBookId?: string
}

interface IBookItem extends IBook {
  reading: boolean,
  downloaded: boolean,
  trace?: string,
  downloading?: boolean,
  localBookId?: string,
  downloadProgress?: {
    total: number,
    downloaded: number,
    progress: string,
    percent: number,
  }
}

interface IChapter {
  id: string,
  title: string,
  level: number,
  cursorStart: number,
  cursorEnd?: number,
}

interface IChapterItem extends IChapter {
  status: 'default' | 'loading' | 'loaded',
  content?: string
}

interface IKeyword {
  id: number
  bookId: number
  keyword: string
  createdAt: string
  lastUsedAt: string
}

interface IReadingState {
  bookId: string
  chapterId: string
  cursor: number
  lastReadTime: number
}


interface IBookEntity {
  id: string
  title: string
  cover: string
  content?: string
  lastReadTime?: number
  catalog?: {
    cursor: number,
    title: string
  }[]
}

interface IBookListItem extends IBook {
  reading?: boolean,
  downloaded?: boolean
}

interface IRemoteBook {
  id: string
  title: string
  cover: string
  downloadUrl: string
}

interface IMarkEntity {
  id: number
  bookId: number
  chapterId: number
  range: {
    start: number,
    length: number,
    markStart: { cursor: number, offset: number },
    markEnd: { cursor: number, offset: number }
  }

  text: string
  thought: string

  style: number
  color: string
}

interface ISettings {
  fontFamily: string
  fontSize: number
  fontWeight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900
  autoPlayDuration: number
}

interface Window {
  remoteBooks: IRemoteBook[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Hammer: any
}

interface DocumentEventMap {
  'app:checkupdates': CustomEvent<{ slient: boolean }>
}

declare const __APP_VERSION__: string

declare module 'vue-virtual-list-v3'
