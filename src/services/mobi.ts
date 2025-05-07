// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { MOBI, isMOBI } from 'foliate-js/mobi.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parseToc = async (book: any, toc: any[], level: number = 1, parentId?: string): (Omit<IChapter, 'cursorStart' | 'cursorEnd'> & { content: string })[] => {
  return (await Promise.all(toc.map(async (item) => {
    const { index: sectionIndex } = await book.resolveHref(item.href)
    const id = sectionIndex.toString()
    const url = await book.sections[sectionIndex].load()
    const text = await new Promise((resolve) => {
      const iframe = document.createElement('iframe')
      iframe.style.cssText = 'position:absolute;left:0;top:0;z-index:-100;width:0;height:0'
      iframe.onload = () => {
        resolve(iframe.contentDocument?.querySelector('body')?.innerText.trim() || item.label)
        iframe.remove()
        URL.revokeObjectURL(url)
      }
      iframe.src = url
      document.body.appendChild(iframe)
    })
    return [
      { title: item.label, id, level, cursorStart: 0, cursorEnd: 0, parentId, content: text },
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
    content = [content, chapterContent].join('\n').trim()
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
