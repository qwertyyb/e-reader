export const fontFamilyList = [
  { value: '思源宋体', label: '思源宋体' },
  { value: '方正书宋', label: '方正书宋' },
  { value: '方正仿宋', label: '方正仿宋' },
  { value: '方正黑体', label: '方正黑体' },
  { value: '方正楷体', label: '方正楷体' },
  { value: '落霞文楷', label: '落霞文楷' },
  { value: '落霞文楷 屏幕阅读版', label: '落霞文楷 阅读版' },
  { value: '975圆体', label: '975圆体' }
]

export const turnPageType = [
  { value: 'vertical-scroll', label: '上下滚动' },
  { value: 'horizontal-scroll', label: '左右滑动' }
]

export const textIndentList = [
  { value: '0', label: '首行顶格' },
  { value: '2em', label: '首行缩进' }
]

export const backgroundList = [
  { label: '仿纸', value: {} },
]

export const defaultTocRegList = [
  /^第[一二三四五六七八九十零百千万亿]+[卷部]\s*[：:·\-—]?\s*(.+)$/,
  /^第[一二三四五六七八九十零百千万亿\d]+[章]\s*[：:·\-—]?\s*(.+)$/,
]

export const defaultPreferences: {
  screenKeepAlive: 'always' | 'reading' | 'never';
  darkMode: 'system' | 'light' | 'dark';
  shelfServerUrl: string;
  opdsServerUrl?: string;
  ai?: {
    baseURL: string,
    model: string,
    apiKey: string
  }
} = {
  screenKeepAlive: 'reading',
  darkMode: 'system',
  shelfServerUrl: './books/index.json',
  opdsServerUrl: './opds/root.xml'
}

export const preferencesStorageKey = 'preferences'

export const readColorScheme: Record<string, IColorScheme> = {
  // 基础模式
  default: { textColor: '#333333', backgroundColor: '#FAF4E3' }, // 经典暖黄

  // 护眼模式
  green: { textColor: '#2D4D32', backgroundColor: '#D8E8D8' }, // 柔和绿

  // 专业模式
  professional: { textColor: '#3D3D3D', backgroundColor: '#FFFFFF' }, // 纯白专业

  // 特色模式
  ocean: { textColor: '#003366', backgroundColor: '#E6F7FF' }, // 海洋蓝
  lavender: { textColor: '#4B4B4B', backgroundColor: '#F0E6FF' }, // 薰衣草紫

  // 深色扩展
  amoled: { textColor: '#A0A0A0', backgroundColor: '#000000' }, // 纯黑AMOLED
  night: { textColor: '#E6E6E6', backgroundColor: '#191928' }, // 深蓝夜读
}
