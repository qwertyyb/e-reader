import { parseTxtFile } from "./txt-file"

export const parseMarkdownFile = (file: File) => {
  return parseTxtFile(file, {
    tocRegList: [
      /^##\s+[^\s]{1,256}/,
      /^###\s+[^\s]{1,256}/,
      /^####\s+[^\s]{1,256}/,
      /^#####\s+[^\s]{1,256}/,
      /^######\s+[^\s]{1,256}/,
    ]
  })
}
