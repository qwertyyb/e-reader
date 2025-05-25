import { ZipReader, BlobReader, TextWriter, BlobWriter, type Entry } from "@zip.js/zip.js"
import * as fflate from 'fflate'

const isZip = async (file: File) => {
  const arr = new Uint8Array(await file.slice(0, 4).arrayBuffer())
  return arr[0] === 0x50 && arr[1] === 0x4b && arr[2] === 0x03 && arr[3] === 0x04
}

const isCBZ = ({ name, type }: { name: string, type: string }) =>
  type === 'application/vnd.comicbook+zip' || name.endsWith('.cbz')

const isFB2 = ({ name, type }: { name: string, type: string }) =>
  type === 'application/x-fictionbook+xml' || name.endsWith('.fb2')

const isFBZ = ({ name, type }: { name: string, type: string }) =>
  type === 'application/x-zip-compressed-fb2'
  || name.endsWith('.fb2.zip') || name.endsWith('.fbz')

const makeZipLoader = async (file: File) => {
  const reader = new ZipReader(new BlobReader(file))
  const entries = await reader.getEntries()
  const map = new Map(entries.map(entry => [entry.filename, entry]))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const load = (f: any) => (name: string, ...args: any[]) =>
      map.has(name) ? f(map.get(name), ...args) : null
  const loadText = load((entry: Entry) => entry.getData?.(new TextWriter()))
  const loadBlob = load((entry: Entry, type: 'string') => entry.getData?.(new BlobWriter(type)))
  const getSize = (name: string) => map.get(name)?.uncompressedSize ?? 0
  return { entries, loadText, loadBlob, getSize }
}

export const parseBook = async (file: File) => {
  if (!file.size) throw new Error('File not found')
  if (await isZip(file)) {
    console.log('isZip')
    const loader = await makeZipLoader(file)
    if (isCBZ(file)) {
      console.log('isCBZ')
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const { makeComicBook } = await import('foliate-js/comic-book.js')
      return makeComicBook(loader, file)
    }
    if (isFBZ(file)) {
      console.log('isFBZ')
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const { makeFB2 } = await import('foliate-js/fb2.js')
      const { entries } = loader
      const entry = entries.find(entry => entry.filename.endsWith('.fb2'))
      const blob = await loader.loadBlob((entry ?? entries[0]).filename)
      return makeFB2(blob)
    }
    console.log('isEPUB')
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { EPUB } = await import('foliate-js/epub.js')
    return new EPUB(loader).init()
  }
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const { isMOBI, MOBI } = await import('foliate-js/mobi.js')
  if (await isMOBI(file)) {
    console.log('isMOBI')
    return new MOBI({ unzlib: fflate.unzlibSync }).open(file)
  }
  if (isFB2(file)) {
    console.log('isFBZ')
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { makeFB2 } = await import('foliate-js/fb2.js')
    return makeFB2(file)
  }
  throw new Error('File type not supported')
}
