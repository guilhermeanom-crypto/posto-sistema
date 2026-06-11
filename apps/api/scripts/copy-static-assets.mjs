// O tsc só emite .js — arquivos .json importados em runtime (readFileSync) ficam
// fora do dist e quebram o boot em produção. Este script copia todos os .json de
// src/ para dist/ preservando a estrutura de pastas. Roda no `pnpm build`.
import { cpSync, mkdirSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const srcDir = join(root, '..', 'src')
const distDir = join(root, '..', 'dist')

function copyJsons(dir, rel = '') {
  for (const entry of readdirSync(join(dir, rel), { withFileTypes: true })) {
    const relPath = join(rel, entry.name)
    if (entry.isDirectory()) copyJsons(dir, relPath)
    else if (entry.name.endsWith('.json')) {
      const dest = join(distDir, relPath)
      mkdirSync(dirname(dest), { recursive: true })
      cpSync(join(dir, relPath), dest)
      console.log(`[copy-static-assets] ${relPath}`)
    }
  }
}

copyJsons(srcDir)
