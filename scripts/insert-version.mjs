import { writeFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { getAssetsWithIntegrity } from './assets-integrity.mjs'

const updateUrl = 'https://qwertyyb.github.io/e-reader/releases.json'

const updateFilePath = join(fileURLToPath(import.meta.url), '../../dist/releases.json')
console.log('update file path', updateFilePath)

const insertVersion = async (version = 'v0.1.0', changelog = '##feature \n - 添加新的特性', { buildVersion }) => {
  let releases = []
  const r = await fetch(`${updateUrl}?_t=${Date.now()}`)
  if (r.ok) {
    const json = await r.json()
    releases = (json.releases || []).map(item => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { assets, ...rest } = item
      return rest
    })
  }

  releases.unshift({
    version,
    buildVersion,
    changelog,
    pubDate: new Date().toISOString(),
    assets: await getAssetsWithIntegrity()
  })
  // 保存最近 30 个版本的变化就已经足够了，无须更多了
  const json = JSON.stringify({ releases: releases.slice(0, 30) })
  writeFileSync(updateFilePath, json)
}

insertVersion(process.env.APP_VERSION, process.env.CHANGELOG, { buildVersion: Number(process.env.BUILDVERSION) })
