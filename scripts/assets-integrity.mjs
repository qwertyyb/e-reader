import { createHash } from "node:crypto";
import { join } from "node:path";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL('../', import.meta.url))
const outDir = join(root, './dist')
const viteManifestPath = join(outDir, ".vite/manifest.json")
const algorithm = "sha384"
const extraResource = [
  'index.html',
  'favicon.ico',
  'manifest.json',
  'sw.js',
  'icons/icon48.png',
  'icons/icon64.png',
  'icons/icon96.png',
  'icons/icon128.png',
  'icons/icon256.png',
]

const getAssets = () => {
  return readFile(viteManifestPath, "utf-8").then((text) => {
    const json = JSON.parse(text)
    const assets = new Set([
      ...extraResource,
      ...Object.values(json).map((item) => {
        return [item.file, ...(item.css || []), ...(item.assets || [])]
      }).flat()
    ])
    return [...assets]
  });
}

function calcIntegrityHash(source, algorithm) {
  const hash = createHash(algorithm).update(source).digest().toString("base64");
  return `${algorithm.toLowerCase()}-${hash}`;
}

async function genIntegrityForAssets(assets) {
  return Promise.all(assets.map(async relPath => {
    const absPath = join(outDir, relPath)
    return {
      path: relPath,
      integrity: calcIntegrityHash(await readFile(absPath), algorithm)
    }
  }))
}

export const getAssetsWithIntegrity = async () => {
  const assets = await getAssets()
  const assetsWithIntegrity = await genIntegrityForAssets(assets)
  return assetsWithIntegrity
}
