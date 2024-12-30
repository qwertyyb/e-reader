import * as fs from 'fs/promises'
import { fileURLToPath } from 'url'

const run = () => {
  const versionPath = fileURLToPath(new URL('../dist/version.json', import.meta.url))
  const version = new Date().toLocaleString('zh-CN').replace(/(\/|\s|:)/g, '')
  console.log('version:', version)
  return fs.writeFile(versionPath, JSON.stringify({ version }))
}

run()
