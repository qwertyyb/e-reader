
import { level1ChapterRegexp, level2ChapterRegexp } from '@/config';
import { decodeText } from '@/utils';

export const parseChapterList = (
  content: string,
  { regList = [new RegExp(level1ChapterRegexp), new RegExp(level2ChapterRegexp)] } = {}
): IChapter[] => {
  const toc: { id: string, title: string, cursorStart: number, cursorEnd?: number, level: number }[] = []
  const parents: Record<number, string> = {}
  const lines = content.split('\n')
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
  return toc
}

export const parseTxtFile = async (file: File, options: { tocRegList: RegExp[] } = { tocRegList: [new RegExp(level1ChapterRegexp), new RegExp(level2ChapterRegexp)] }) => {
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

  const content = await load(file)
  const title = getTitle(file.name)
  const chapterList = parseChapterList(content, { regList: options.tocRegList })

  return {
    title,
    content,
    maxCursor: content.split('\n').length - 1,
    chapterList
  }
}
