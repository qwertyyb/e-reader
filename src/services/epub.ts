import { dirPath, pathJoin } from "@/utils"
import { ZipReader, BlobReader, TextWriter, BlobWriter, type Entry } from "@zip.js/zip.js"

const xmlParser = new DOMParser()

const readXML = async (entries: Entry[], filename: string | undefined | null, rootPath?: string) => {
  if (!filename) {
    throw new Error('解析失败')
  }
  const filePath = rootPath ? pathJoin(rootPath, filename) : filename
  const entry = entries.find(entry => entry.filename === filePath)
  if (!entry) {
    throw new Error('未找到文件' + filename)
  }
  const text = (await entry.getData?.(new TextWriter()))?.trim()
  if (!text) {
    throw new Error(filename + '是空的')
  }
  return xmlParser.parseFromString(text, 'text/xml')
}

const checkIsEpubFile = async (entries: Entry[]) => {
  const mimetype = entries.find(item => item.filename === 'mimetype')
  if (!mimetype) {
    throw new Error('not found mimetype')
  }
  const text = await mimetype.getData?.(new TextWriter())
  if (text?.trim() !== 'application/epub+zip') {
    throw new Error('不合法的epub文件')
  }
  return true
}

const getCover = async (rootDoc: Document, entries: Entry[], rootDir: string) => {
  const coverImageId = rootDoc.querySelector('metadata meta[name="cover"]')?.getAttribute('content')
  let cover: Blob | null | undefined = null
  if (!coverImageId) {
    console.warn('没有封面')
    return
  }
  const coverImageRef = rootDoc.querySelector(`manifest item[id="${coverImageId}"]`)
  const mediaType = coverImageRef?.getAttribute('media-type')
  if (!mediaType?.startsWith('image/')) {
    console.warn('封面不是图片: ' + mediaType)
    return null
  }
  // 封面是一张图片
  const href = coverImageRef!.getAttribute('href')
  if (href) {
    const coverFileName = pathJoin(rootDir, href)
    const coverEntry = entries.find(entry => entry.filename === coverFileName)
    if (coverEntry) {
      cover = await coverEntry.getData?.(new BlobWriter(mediaType))
      if (!cover) {
        console.warn('读取封面图片失败')
      }
    } else {
      console.warn('未找到封面文件')
    }
  } else {
    console.warn('封面的引用地址为空')
  }
  return cover
}

const parseContent = async (relativePath: string, rootDir: string, entries: Entry[]) => {
  const [path, hash] = relativePath.split('#')
  const entry = entries.find(entry => entry.filename === pathJoin(rootDir, path))
  if (!entry) {
    throw new Error('未找到内容文件' + relativePath)
  }
  const text = await entry.getData?.(new TextWriter())
  if (!text) {
    throw new Error('空内容' + relativePath)
  }
  const parser = new DOMParser()
  const doc = parser.parseFromString(text, 'text/xml')
  if (hash) {
    return (doc.getElementById(hash)?.textContent || '').trim()
  }
  return (doc.body.textContent || '').trim()
}

const parseNavPoint = async (navPoint: Element, level: number, options: { rootDir: string, entries: Entry[] }): Promise<(IChapter & { content: string })[]> => {
  const src = navPoint.querySelector('content')?.getAttribute('src')
  if (!src) {
    throw new Error('目录项目 src 属性不存在')
  }
  const title = navPoint.querySelector('navLabel')?.textContent?.trim() || ''
  const content = await parseContent(src, options.rootDir, options.entries)
  const item: IChapter & { content: string } = {
    id: navPoint.getAttribute('id')!,
    title,
    level,
    content: content,
    cursorStart: 0
  }

  const children = (await Promise.all(
    Array.from(navPoint.children).filter(node => node.nodeName.toLowerCase() === 'navpoint')
      .map(navPoint => parseNavPoint(navPoint, level + 1, options))
  )).flat()

  return [item, ...children]
}

const parseTocAndContent = async (doc: Document, rootDir: string, entries: Entry[]) => {
  const tocId = doc.querySelector('spine')?.getAttribute('toc')
  if (!tocId) {
    // 虽然 spine 上的 toc 属性在 epub 3 规范中已移除，但是这是确定目录的唯一方式
    throw new Error('spine 元素没有 toc 属性')
  }
  const tocRef = doc.querySelector(`manifest item[id="${tocId}"]`)
  if (!tocRef) {
    throw new Error('未在清单目录中找到 ID 为TOC 的项目')
  }
  const tocHref = tocRef.getAttribute('href')
  const tocDoc = await readXML(entries, tocHref, rootDir)
  const navPoints = Array.from(tocDoc.querySelectorAll('navMap > navPoint'))
  let chapterContentList: (IChapter & { content: string })[] = []
  for (let i = 0; i < navPoints.length; i += 1) {
    chapterContentList = [...chapterContentList, ...(await parseNavPoint(navPoints[i], 1, { rootDir, entries }))]
  }
  let cursor = -1
  let bookContent = ''
  const chapterList: IChapter[] = []
  chapterContentList.forEach((item, index) => {
    const { content, ...chapter } = item
    chapter.cursorStart = cursor + 1
    chapter.cursorEnd = chapter.cursorStart + content.split('\n').length - 1
    cursor = chapter.cursorEnd
    if (index > 0) {
      bookContent = [bookContent, content].join('\n')
    } else {
      bookContent = content
    }
    chapterList.push(chapter)
  })
  return {
    chapterList,
    content: bookContent
  }
}

export const parseEpubFile = async (blob: Blob | File): Promise<{ cover: Blob | undefined | null, title: string, content: string, maxCursor: number, chapterList: IChapter[] }> => {
  // 先把 epub 文件解压
  const reader = new ZipReader(new BlobReader(blob))
  const entries = await reader.getEntries()

  checkIsEpubFile(entries)

  const containerDoc = await readXML(entries, 'META-INF/container.xml')
  const rootfilePath = containerDoc.querySelector('rootfile')?.getAttribute('full-path')
  const doc = await readXML(entries, rootfilePath)
  const rootDir = dirPath(rootfilePath!)
  const cover = await getCover(doc, entries, rootDir)
  const { content, chapterList } = await parseTocAndContent(doc, rootDir, entries)

  const title = doc.querySelector('metadata dc\\:title')?.textContent
  return {
    title: title || 'name' in blob ? (blob as File).name.replace(/\.[^.]+$/, '') : '',
    cover,
    maxCursor: content.split('\n').length - 1,
    content,
    chapterList,
  }
}
