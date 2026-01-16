import dedent from "dedent";

// 需要在 assets/font.scss 中定义
export const fontFamilyList = [
  { value: '思源黑体', label: '思源黑体' },
  { value: '思源宋体', label: '思源宋体' },
  { value: '思源等宽', label: '思源等宽' },
  { value: '方正书宋', label: '方正书宋' },
  { value: '方正仿宋', label: '方正仿宋' },
  { value: '方正黑体', label: '方正黑体' },
  { value: '方正楷体', label: '方正楷体' },
  { value: '落霞文楷', label: '落霞文楷' },
  { value: '落霞文楷 等宽', label: '落霞文楷 等宽' },
  { value: '落霞文楷 屏幕阅读版', label: '落霞文楷 阅读版' },
  { value: '975圆体', label: '975圆体' },
  { value: '朱雀仿宋', label: '朱雀仿宋' },
  { value: '阿里妈妈东方大楷', label: '阿里妈妈东方大楷' },
  { value: '钉钉进步体', label: '钉钉进步体' },
  { value: '阿里妈妈数黑体', label: '阿里妈妈数黑体' },
  { value: '阿里妈妈刀隶体', label: '阿里妈妈刀隶体' },
  { value: '阿里妈妈方圆体', label: '阿里妈妈方圆体' },
  { value: '淘宝买菜体', label: '淘宝买菜体' },

  { value: '站酷仓耳渔阳体', label: '站酷仓耳渔阳体' },
  { value: '站酷庆科黄油体', label: '站酷庆科黄油体' },
  { value: '站酷快乐体', label: '站酷快乐体' },
  { value: '站酷酷黑体', label: '站酷酷黑体' },
  { value: '站酷高端黑体', label: '站酷高端黑体' },
  { value: '站酷文艺体', label: '站酷文艺体' },
  { value: '站酷小薇LOGO体', label: '站酷小薇LOGO体' },

  { value: '仓耳舒圆体', label: '仓耳舒圆体' },
  { value: '仓耳非白', label: '仓耳非白' },
  { value: '仓耳与墨', label: '仓耳与墨' },
  { value: '仓耳周珂正大榜书', label: '仓耳周珂正大榜书' },
  { value: '仓耳小丸子', label: '仓耳小丸子' },


  { value: '芫荽', label: '芫荽' },

  // { value: 'OPPO Sans', label: 'OPPO Sans' },

  { value: '文泉驿正黑体', label: '文泉驿正黑体' },
  { value: '文泉驿微米黑', label: '文泉驿微米黑' },

  { value: '抖音美好体', label: '抖音美好体' },

  { value: '源泉圆体', label: '源泉圆体' },
  { value: '源样明体', label: '源样明体' },
  { value: '源起明体', label: '源起明体' },
  { value: '源云明体', label: '源云明体' },

  { value: 'jf open 粉圓', label: 'jf open 粉圓' },

  { value: '三极行楷简体-粗', label: '三极行楷简体-粗' }
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

export const defaultPreferences: IPreferences = {
  screenKeepAlive: 'reading',
  darkMode: 'system',
  autoOpenLastRead: true,
  shelfServerUrl: './books/index.json',
  opdsServerUrl: './opds/root.xml',
  sync: {
    enabled: true,
    server: 'https://e-reader.qwertyyb.cn',
  },
  ai: {
    baseURL: '',
    model: '',
    apiKey: ''
  }
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
