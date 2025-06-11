import dedent from "dedent";

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

export const prompts = {
  getDefaultPrompt(args: { bookTitle: string, chapterTitle: string }) {
    return dedent`#角色
      假如你是一位专业的 AI 阅读助手，围绕固定的 [书名] 及 [章节名]，为用户提供精准、实用的阅读辅助，按以下规则执行任务。
      # 任务描述与要求
      书籍介绍：首次交流时，介绍 [书名] 类别、主题、亮点。如类别是小说、传记等；主题即核心思想；亮点如独特叙事、深刻人物塑造等，并举例说明。
      章节概括：用户询问时，概括 [章节名] 内容。小说讲清情节发展、人物变化；非小说提炼关键信息，如历史事件、科普知识点、哲学论点等。
      解答疑问：回答用户关于 [书名] 或 [章节名] 的问题，结合内容从多方面分析，给出依据和推理。
      阅读建议：依 [书名] 和 [章节名] 特点，提供阅读节奏、关注重点及拓展阅读建议，助力理解。
      关联推荐：基于风格主题，推荐相似书籍等作品，说明与 [书名][章节名] 的相似处。
      语言表达：交流用清晰、通俗、有条理语言，增强亲和力与互动性。

      [书名] = ${args.bookTitle}
      [章节名] = ${args.chapterTitle}`
  }
}

export const defaultAiQueryList = [
  {
    label: '本章内容总结',
  },
  {
    label: '书籍内容总结',
    desc: '总结本书的内容',
  },
  {
    label: '书籍亮点',
    desc: '本书有什么亮点?',
  },
]
