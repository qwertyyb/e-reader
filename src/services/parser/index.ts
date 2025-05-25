import { blobToBase64 } from "@/utils"
import { parseEpubFile } from "./epub"
import { parseTxtFile } from "./txt-file"
import { parseMobiFile } from "./mobi"
import { defaultTocRegList } from "@/config"

export const parseFile = async (file: File) => {
  if (file.name.endsWith('.epub')) {
    const result = await parseEpubFile(file)
    return {
      content: result.content,
      cover: result.cover ? await blobToBase64(result.cover) : '',
      title: result.title,
      maxCursor: result.maxCursor,
      chapterList: result.chapterList
    }
  }
  if (file.name.endsWith('.txt')) {
    const result = await parseTxtFile(file, { tocRegList: defaultTocRegList })
    return {
      cover: await blobToBase64(result.cover),
      title: result.title,
      content: result.content,
      maxCursor: result.maxCursor,
      chapterList: result.chapterList
    }
  }
  // @todo mobi 格式的支持有问题，解析可能会出错，需要重新梳理
  const result = await parseMobiFile(file)
  return {
    content: result.content,
    cover: result.cover ? await blobToBase64(result.cover) : '',
    title: result.title,
    maxCursor: result.maxCursor,
    chapterList: result.chapterList
  }
}
