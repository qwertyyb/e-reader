
import { defaultTocRegList } from '@/config';
import { decodeText } from '@/utils';
import { generateBookCover } from '@/utils/cover';

export const parseChapterList = (
  content: string,
  { regList = defaultTocRegList } = {}
): { chapterList: IChapter[], content: string } => {
  const toc: { id: string, title: string, cursorStart: number, cursorEnd?: number, level: number }[] = []
  const parents: Record<number, string> = {}
  const lines = content.split('\n')
  if (lines[0].trim() === '前言') {
    toc.push({
      id: '0',
      title: '前言',
      cursorStart: 0,
      cursorEnd: undefined,
      level: 1
    })
  } else if (!regList[0].test(lines[0].trim())) {
    // 如果起始不是章节，插入一个前言
    lines.unshift('前言')
    toc.push({
      id: '0',
      title: '前言',
      cursorStart: 0,
      cursorEnd: undefined,
      level: 1
    })
  }
  lines.forEach((line, row) => {
    const index = regList.findIndex(reg => reg.test(line.trim()))
    if (index < 0) return;
    if (toc.length > 0) {
      toc[toc.length - 1]!.cursorEnd = row - 1
    }
    const level = index + 1
    const chapter: IChapter = {
      id: String(row),
      title: line.trim(),
      cursorStart: row,
      cursorEnd: undefined,
      level
    }
    if (level > 1 && parents[level - 1]) {
      chapter.parentId = parents[level - 1]
    }
    parents[level] = chapter.id
    toc.push(chapter)
  })
  if (toc.length) {
    toc[toc.length - 1].cursorEnd = lines.length - 1
  }
  // level 可能缺失，此处重新校正一下
  const minLevel = Math.min(...toc.slice(1).map(item => item.level))
  toc.slice(1).forEach(item => {
    item.level = item.level - minLevel + 1
  })
  return { chapterList: toc, content: lines.join('\n') }
}

export const parseTxtFile = async (file: File, options: { tocRegList: RegExp[] } = { tocRegList: defaultTocRegList }) => {
  const load = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.addEventListener('load', async () => {
        const result = reader.result

        try {
          resolve(decodeText(result as ArrayBuffer))
        } catch(err) {
          reject(err)
        }
      })
      reader.addEventListener('error', () => reject(reader.error))
      reader.readAsArrayBuffer(file)
    })
  }

  const getTitle = (fileName: string) => fileName.replace(/\.[^.]+$/, '')

  const text = await load(file)
  const title = getTitle(file.name)
  const { chapterList, content } = parseChapterList(text, { regList: options.tocRegList })

  return {
    title,
    content,
    cover: await generateBookCover(title),
    maxCursor: content.split('\n').length - 1,
    chapterList
  }
}
