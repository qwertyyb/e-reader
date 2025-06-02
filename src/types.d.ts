interface IDownloadingStatus {
  total: number
  downloaded: number
  progress: string
}

interface IBook {
  id: string
  title: string
  cover: string
  author?: string
}

interface ILocalBook extends IBook {
  onlineBookId?: string,
  maxCursor: number,
  tocRegList?: RegExp[]
}

interface IBookItem extends IBook {
  reading: boolean,
  downloaded: boolean,
  trace?: string,
  downloading?: boolean,
  onlineBookId?: string,
  localBookId?: string,
  lastReadTime?: number,
  downloadUrl?: string,
  tocRegList?: RegExp[],
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
  parentId?: string
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
  duration?: number // 阅读时长，单位: 秒
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
  author?: string
  downloadUrl: string
  tocRegList?: RegExp[]
}

interface IMarkEntity {
  id: number
  bookId: number
  chapterId: string
  chapterIndex: number
  range: {
    start: number,
    length: number,
  }

  text: string
  thought: string

  style: number
  color: string
}

type TurnPageType = 'horizontal-scroll' | 'vertical-scroll'

interface IColorScheme { textColor: string, backgroundColor: string }

interface ISettings {
  fontFamily: string
  fontSize: number
  fontWeight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900
  lineHeight: number
  speed: number
  readSpeakRate: number
  // 翻页方式
  turnPageType?: TurnPageType
  colorScheme?: { backgroundColor: string, textColor: string }

  openai?: {
    baseURL: string,
    model: string,
    apiKey: string
  }
}

interface DocumentEventMap {
  'app:checkupdates': CustomEvent<{ slient: boolean }>
}

declare const __APP_VERSION__: string
declare const __BUILD_VERSION__: string

declare module 'vue-virtual-list-v3'
