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
  debugMode: boolean;
} = { screenKeepAlive: 'reading', darkMode: 'system', debugMode: false }

export const preferencesStorageKey = 'preferences'
