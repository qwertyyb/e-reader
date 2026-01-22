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

interface IReadTime {
  bookId: string
  date: string // eg. 2025/06/04
  duration: number // 单位为秒，当天阅读时长
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
  start?: {
    cursor: number,
    offset: number,
  },
  end?: {
    cursor: number,
    offset: number,
  }
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
  textIndent: string
  // 翻页方式
  turnPageType?: TurnPageType
  colorScheme?: { backgroundColor: string, textColor: string }
}

interface IPreferences {
  screenKeepAlive: 'always' | 'reading' | 'autoPlay' | 'never';
  darkMode: 'system' | 'light' | 'dark';
  autoOpenLastRead: boolean;
  shelfServerUrl: string;
  opdsServerUrl?: string;
  ai: { baseURL: string, apiKey: string, model: string };
  sync: { enabled: boolean, server: string, username: string, password: string, device: string, deviceId: string };
  tts?: 'local' | 'edge-tts',

  volumeControl: 'disabled' | 'normal' | 'reverse', // 音量键翻页，仅 APP 内生效
}

interface DocumentEventMap {
  'app:checkupdates': CustomEvent<{ slient: boolean }>
}

declare const __APP_VERSION__: string
declare const __BUILD_VERSION__: string

declare module 'vue-virtual-list-v3'
