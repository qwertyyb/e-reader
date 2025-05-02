
import { level1ChapterRegexp, level2ChapterRegexp } from '@/config';
import jschardet from 'jschardet'

const decodeText = (arrayBuffer: ArrayBuffer) => {
  const bytes = new Uint8Array(arrayBuffer.slice(0, 10000));
  let binary = ''
  bytes.forEach(item => {
    binary += String.fromCharCode(item)
  })
  const { encoding } = jschardet.detect(binary)
  console.log('encoding', encoding)
  const decoder = new TextDecoder(encoding, { fatal: true })
  try {
    return decoder.decode(arrayBuffer).replace(/\r\n/g, '\n')
  } catch {
    throw new Error('解码失败')
  }
}

export const parseChapterList = (
  content: string,
  { regList = [new RegExp(level1ChapterRegexp), new RegExp(level2ChapterRegexp)] } = {}
) => {
  const toc: { id: string, title: string, cursorStart: number, cursorEnd?: number, level: number }[] = []
  const parents: Record<number, string> = {}
  content.split('\n').forEach((line, row) => {
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
  return toc
}

export const parseTxtFile = async (file: File) => {
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

  return {
    title,
    content,
    catalog: parseChapterList(content)
  }
}

const downloadWithProgress = async (url: string, onUpdate?: (progress: number, total: number) => void) => {
  const response = await fetch(url)
  const total = Number(response.headers.get('Content-Length')) || 0
  const result = []
  let progress = 0
  const reader = response.body!.getReader()
  while(true) {
    const { done, value } = await reader.read()
    if (done) {
      break;
    }
    result.push(value)
    progress += value.length
    onUpdate?.(progress, total)
  }

  const data = new Uint8Array(progress)

  let position = 0
  result.forEach(item => {
    data.set(item, position)
    position += item.length
  })

  return data
}

export const download = async (downloadUrl: string, onUpdate?: (progress: number, total: number) => void) => {
  const arrayBuffer = await downloadWithProgress(downloadUrl, onUpdate)
  const content = decodeText(arrayBuffer.buffer)
  const chapterList = parseChapterList(content)
  return {
    content,
    chapterList,
  }
}
