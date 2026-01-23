import { join } from 'node:path'
import { readFile, writeFile } from 'node:fs/promises'
import { root } from './const.mjs'

const htmlPath = join(root, './appdist/e-reader/index.html')

const scripts = {
  'https://unpkg.com/pwacompat': '/e-reader/lib/pwacompat.min.js',
  'https://cdn.jsdelivr.net/npm/eruda': '/e-reader/lib/eruda.js'
}

const replace = async () => {
  const content = await readFile(htmlPath, 'utf-8')
  let result = content
  for (const [key, value] of Object.entries(scripts)) {
    result = result.replace(key, value)
  }
  await writeFile(htmlPath, result)
}

replace()
