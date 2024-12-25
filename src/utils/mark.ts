import Mark from 'mark.js'
import { marks } from "@/services/storage"

const getPreviousOffset = (node: HTMLElement | ChildNode | ParentNode | null, stopEl: HTMLElement): number => {
  if (!node) return 0

  if (stopEl === node) return 0

  const length = node.textContent?.length ?? 0

  if (node.previousSibling) {
    return length + getPreviousOffset(node.previousSibling, stopEl)
  }
  return length + getPreviousOffset(node.parentNode, stopEl)
}

export const getClosest = (node: HTMLElement, selector: string) => {
  return node?.closest?.(selector) || node?.parentElement?.closest?.(selector)
}

export const getParagraphOffset = ({ node, offset }: { node: HTMLElement, offset: number }) => {
  const p = getClosest(node, 'p[data-chapter-text-offset]') as HTMLElement
  return offset + getPreviousOffset(node.previousSibling, p)
}

export const getChapterOffset = ({ node, offset }: { node: HTMLElement, offset: number }) => {
  const p = getClosest(node, 'p[data-chapter-text-offset]') as HTMLElement
  return getParagraphOffset({ node, offset }) + parseInt(p.dataset.chapterTextOffset || '0', 10)
}

export const getParagraphPoint = ({ node, offset }: { node: HTMLElement, offset: number }) => {
  const p = getClosest(node, 'p[data-chapter-text-offset]') as HTMLElement
  return {
    offset: getParagraphOffset({ node, offset }),
    cursor: parseInt(p.dataset.cursor || '0', 10)
  }
}

export class ChapterMarkRange {
  start = 0
  length = 0
  markStart = { cursor: 0, offset: 0 }
  markEnd = { cursor: 0, offset: 0 }
  constructor(range: Range) {
    const chapterStartOffset = getChapterOffset({ node: range.startContainer as HTMLElement, offset: range.startOffset })
    const chapterEndOffset = getChapterOffset({ node: range.endContainer as HTMLElement, offset: range.endOffset })
    this.start = chapterStartOffset
    this.length = chapterEndOffset - chapterStartOffset
    this.markStart = getParagraphPoint({ node: range.startContainer as HTMLElement, offset: range.startOffset })
    this.markEnd = getParagraphPoint({ node: range.endContainer as HTMLElement, offset: range.endOffset })
  }
}

export const MarkType = {
  UNKNOWN: 0,
  UNDERLINE: 1,
  THOUGHT: 2,
}

export const MarkStyles = {
  SOLID: 1,
  WAVE: 2,
  HIGHLIGHT: 3,
}

export const MarkStyleIcons = {
  [MarkStyles.SOLID]: 'format_underlined',
  [MarkStyles.WAVE]: 'format_underlined_squiggle',
  [MarkStyles.HIGHLIGHT]: 'texture'
}

export const MarkColors = {
  YELLOW: 'yellow',
  BLUE: 'blue',
  PURPLE: 'purple',
  GREEN: 'green',
  RED: 'red'
}

export class MarkData {
  id?: number
  bookId = 0
  chapterId = 0
  text = ''
  range: ChapterMarkRange
  type = MarkType.UNKNOWN
  thought = ''
  style = MarkStyles.SOLID
  color = MarkColors.BLUE

  constructor({
    range, bookId, chapterId
  }: { bookId: number, chapterId: number, range: Range }) {
    this.range = new ChapterMarkRange(range)
    this.bookId = bookId
    this.chapterId = chapterId
    this.text = range.toString()
  }
}

export class ChapterMark {
  bookId = 0
  chapterId = 0
  markList: MarkData[] = []
  markInstance: Mark
  container: HTMLElement
  constructor(bookId: number, chapterId: number, container: HTMLElement) {
    this.container = container
    this.bookId = bookId
    this.chapterId = chapterId
    this.markInstance = new Mark(this.container)
  }
  render() {
    this.markInstance.unmark()
    this.markList.forEach(markData => {
      const { range, id, type, color, style } = markData
      const className = type === MarkType.UNDERLINE ? 'underline' : 'thought'
      this.markInstance.markRanges([range], {
        className,
        each(markedDom) {
          const dom = markedDom as HTMLElement
          dom.dataset.id = id?.toString()
          dom.dataset.type = type.toString()
          if (style === MarkStyles.HIGHLIGHT) {
            dom.style.backgroundColor = color || ''
          } else {
            dom.style.cssText = `text-decoration:underline;text-decoration-style:${style === MarkStyles.WAVE ? 'wavy' : 'solid'};text-decoration-color:${color};text-underline-offset: 0.3em`
          }
        }
      })
    })
    return this.container
  }
  async refresh() {
    this.markList = await marks.getListByChapterAndBook(this.bookId, this.chapterId)
    return this.render()
  }
  /**
   *
   * @param {MarkData} markData 待新增的markData
   */
  async mark(markData: MarkData) {
    await marks.add(markData)
    await this.refresh()
  }
  /**
   *
   * @param {number} id Mark id
   */
  async unmark(id: number) {
    await marks.remove(id)
    await this.refresh()
  }
}
