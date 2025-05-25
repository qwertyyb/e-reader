import { parseBook } from './foliate'

const loadDoc = (() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const loadState = new WeakMap<any, Promise<Document>>()
  return (section: { id: string | number, createDocument: () => Promise<Document> }) => {
    if (!loadState.get(section)) {
      loadState.set(section, section.createDocument())
    }
    return loadState.get(section)!
  }
})()

const rangeText = (startEl: HTMLElement, endEl: HTMLElement | null, doc: Document) => {
  const range = doc.createRange();
  range.setStartBefore(startEl)
  range.setEndBefore(endEl || startEl.parentElement!.lastElementChild!)
  return range.cloneContents().textContent?.trim()
}

interface ITocItem {
  label: string
  href: string
  subitems?: ITocItem[] | null
}

const flatToc = (toc: ITocItem[], level: number = 1, parentId?: string): { href: string, title: string, id: string, level: number, parentId?: string }[] => {
  return toc.map((item) => {
    const id: string = item.href
    return [
      { href: item.href, title: item.label, id, level, parentId },
      ...flatToc(item.subitems || [], level + 1, id)
    ]
  }).flat()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parseToc = async (book: any, toc: ReturnType<typeof flatToc>): Promise<(Omit<IChapter, "cursorStart" | "cursorEnd"> & { content: string })[]> => {
  return Promise.all(toc.map(async (item, index) => {
    const { index: sectionIndex, anchor } = await book.resolveHref(item.href)
    const id = `${sectionIndex.toString()}-${Math.round(Math.random() * 10 * 1000 * 1000)}`
    const section = book.sections[sectionIndex]
    const doc = await loadDoc(section)
    const anchorEl: HTMLElement | null = anchor(doc)
    let text = item.title
    console.log(index, id, sectionIndex, item, doc, doc.body, anchorEl)
    if (!anchorEl) {
      // 如果没有anchor,则本章内容取整个文档
      text = (doc?.body ?? doc.documentElement).innerText.trim() ?? item.title
    } else {
      const next = toc[index + 1]
      if (next) {
        const { index: nextSectionIndex, anchor: nextAnchor } = await book.resolveHref(next.href)
        const nextDoc = await loadDoc(book.sections[nextSectionIndex])
        const nextAnchorEl: HTMLElement = nextAnchor(nextDoc)
        if (nextAnchorEl && nextAnchorEl.ownerDocument === doc) {
          // 如果下一个节点的开始位置和上一个节点的开始位置在同一份文档中，则取这两个文档的区间内容作为本章内容
          text = rangeText(anchorEl, nextAnchorEl, doc) || item.title
        } else {
          text = rangeText(anchorEl, null, doc) ?? item.title
        }
      } else {
        text = rangeText(anchorEl, null, doc) ?? item.title
      }
    }
    return { ...item, cursorStart: 0, cursorEnd: 0, content: text }
  }))
}

const formatChapterList = (chapterContentList: (Omit<IChapter, 'cursorStart' | 'cursorEnd'> & { content: string })[]): { chapterList: IChapter[], content: string } => {
  let cursorStart = -1
  let content = ''
  const chapterList: IChapter[] = []
  console.log(chapterContentList)
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
  const book = await parseBook(file)
  console.log(book)

  const toc = flatToc(book.toc)
  const chapterContentsList = await parseToc(book, toc)
  const { chapterList, content } = formatChapterList(chapterContentsList)

  return {
    cover: await book.getCover(),
    title: book.metadata.title,
    content,
    chapterList,
    maxCursor: content.split('\n').length - 1,
  }
}
