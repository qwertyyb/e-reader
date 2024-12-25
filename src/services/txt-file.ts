
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

export const parseCatalog = (content: string, { regList = [/^第.+章/] } = {}) => {
  const toc: { title: string, cursor: number, level: number }[] = []
  content.split('\n').forEach((line, row) => {
    const index = regList.findIndex(reg => reg.test(line.trim()))
    if (index < 0) return;
    toc.push({
      title: line.trim(),
      cursor: row,
      level: index + 1
    })
  })
  return toc
}

export const parseTxtFile = async (file: File, { tocReg = /^第.+章/ } = {}) => {
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
    catalog: parseCatalog(content, { regList: [tocReg] })
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

export const download = async (book: IRemoteBook, onUpdate?: (progress: number, total: number) => void) => {
  const arrayBuffer = await downloadWithProgress(book.downloadUrl, onUpdate)
  const content = await decodeText(arrayBuffer)
  const catalog = parseCatalog(content)
  return {
    ...book,
    content,
    catalog,
  }
}
