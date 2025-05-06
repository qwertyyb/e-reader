// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { MOBI, isMOBI } from 'foliate-js/mobi.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parseToc = async (book: any, toc: any[], level: number = 1, parentId?: string): (Omit<IChapter, 'cursorStart' | 'cursorEnd'> & { content: string })[] => {
  return (await Promise.all(toc.map(async (item) => {
    const { index: sectionIndex } = await book.resolveHref(item.href)
    const doc = await book.sections[sectionIndex].createDocument()
    const text = doc.querySelector('body')?.textContent?.trim() || item.label
    return [
      { title: item.label, id: String(sectionIndex), level, cursorStart: 0, cursorEnd: 0, parentId, content: text },
      ...(await parseToc(book, item.subitems || [], level + 1, id))
    ]
  }))).flat()
}

const formatChapterList = (chapterContentList: (Omit<IChapter, 'cursorStart' | 'cursorEnd'> & { content: string })[]): { chapterList: IChapter, content: string } => {
  let cursorStart = -1
  let content = ''
  const chapterList: IChapter[] = []
  chapterContentList.forEach(item => {
    const { content: chapterContent, ...rest } = item
    content = [content, chapterContent].join('\n')
    const cursorEnd = cursorStart + chapterContent.split('\n').length
    chapterList.push({
      ...rest,
      cursorStart: cursorStart + 1,
      cursorEnd
    })
    cursorStart = cursorEnd
  })
  return { chapterList, content }
}

export const parseMobiFile = async (file: File): Promise<{ cover: Blob | undefined | null, title: string, content: string, maxCursor: number, chapterList: IChapter[] }> => {
  if (!(await isMOBI(file))) {
    throw new Error('非 mobi 文件')
  }
  // @ts-nocheck
  const fflate = await import('foliate-js/vendor/fflate.js')
  const book = await new MOBI({ unzlib: fflate.unzlibSync }).open(file)

  const chapterContentsList = await parseToc(book, book.toc)
  const { chapterList, content } = formatChapterList(chapterContentsList)

  return {
    cover: await book.getCover(),
    title: book.metadata.title,
    content,
    chapterList,
    maxCursor: content.split('\n').length - 1,
  }
}
