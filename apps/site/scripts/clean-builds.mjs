import { rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const appRoot = path.resolve(__dirname, '..')

const buildDirs = [
  path.join(appRoot, '.next'),
  path.join(appRoot, '.next-dev'),
  path.join(appRoot, 'tmp'),
]

await Promise.all(
  buildDirs.map(async (target) => {
    try {
      await rm(target, { force: true, recursive: true })
      console.log(`[apps/site] build limpo: ${target}`)
    } catch (error) {
      console.warn(`[apps/site] nao foi possivel limpar ${target}:`, error)
    }
  })
)
