import { join } from "node:path";
import { fileURLToPath } from "node:url"

export const root = fileURLToPath(new URL('../', import.meta.url))
export const outDir = join(root, './dist')
