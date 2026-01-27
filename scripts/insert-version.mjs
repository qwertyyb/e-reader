import { writeFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { getAssetsWithIntegrity } from './assets-integrity.mjs'

const updateUrl = 'https://qwertyyb.github.io/e-reader/releases.json'

const APP_VERSION = process.env.APP_VERSION
const BUILDVERSION = Number(process.env.BUILDVERSION)
const CHANGELOG = process.env.CHANGELOG
const ANDROID_DOWNLOAD_URL = process.env.ANDROID_DOWNLOAD_URL

const updateFilePath = join(fileURLToPath(import.meta.url), '../../dist/releases.json')
console.log('update file path', updateFilePath)

const insertVersion = async (version = 'v0.1.0', changelog = '##feature \n - 添加新的特性', { buildVersion, androidDownloadUrl }) => {
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
    androidDownloadUrl,
    pubDate: new Date().toISOString(),
    assets: await getAssetsWithIntegrity()
  })
  // 保存最近 30 个版本的变化就已经足够了，无须更多了
  const json = JSON.stringify({ releases: releases.slice(0, 30) })
  writeFileSync(updateFilePath, json)
}

if (!APP_VERSION || !BUILDVERSION || !ANDROID_DOWNLOAD_URL) {
  console.error('APP_VERSION, BUILDVERSION, CHANGELOG, ANDROID_DOWNLOAD_URL is required')
  process.exit(1)
}

insertVersion(APP_VERSION, CHANGELOG, { buildVersion: BUILDVERSION, androidDownloadUrl: ANDROID_DOWNLOAD_URL })
