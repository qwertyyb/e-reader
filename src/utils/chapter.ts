import { getChapterOffset, getClosest } from "./mark"

export const renderChapter = (chapter: IChapter, content: string, chapterIndex: number) => {
  const chapterEl = document.createElement('div')
  chapterEl.classList.add('chapter')
  chapterEl.dataset.id = chapter.id
  chapterEl.dataset.chapterIndex = JSON.stringify(chapterIndex)
  let chapterTextOffset = 0
  content.split('\n').forEach((line, i) => {
    const str = line.trim()
    if (i === 0) {
      // 第一个一般是章节标题
      const h3 = document.createElement('h3')
      h3.dataset.chapterIndex = String(chapterIndex)
      h3.dataset.cursor = String(chapter.cursorStart + i)
      h3.dataset.level = String(chapter.level)
      h3.dataset.chapterTextOffset = String(chapterTextOffset)
      h3.classList.add('chapter-title')
      h3.textContent = str
      chapterEl.appendChild(h3)
    } else {
      const p = document.createElement('p')
      p.dataset.cursor = String(chapter.cursorStart + i)
      p.dataset.chapterTextOffset = String(chapterTextOffset)
      p.classList.add('paragraph')
      p.textContent = str
      chapterEl.appendChild(p)
    }
    chapterTextOffset += str.length
  })

  return chapterEl.outerHTML
}

export const parseSelectionRange = (range: Range): {
  chapterId: string,
  chapterIndex: number,
  startOffset: number,
  length: number,
  text: string,
} | null => {
  // 先确认 range 是否跨了章节
  const startChapterEl = getClosest(range.startContainer, '.chapter') as HTMLElement
  const endChapterEl = getClosest(range.endContainer, '.chapter') as HTMLElement
  if (!startChapterEl || !endChapterEl) {
    console.warn('未选中章节内内容')
    return null
  }
  if (startChapterEl !== endChapterEl) {
    console.warn('不支持跨章节的笔记')
    return null
  }
  const startOffset = getChapterOffset({ node: range.startContainer as HTMLElement, offset: range.startOffset })
  const endOffset = getChapterOffset({ node: range.endContainer as HTMLElement, offset: range.endOffset })
  const length = endOffset - startOffset
  return {
    chapterId: startChapterEl.dataset.id!,
    chapterIndex: Number(startChapterEl.dataset.chapterIndex),
    startOffset,
    length,
    text: range.toString()
  }
}
