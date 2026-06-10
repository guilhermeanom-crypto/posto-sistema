import { rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const appRoot = path.resolve(__dirname, '..')

/**
 * O `.next` é limpo antes de dev/build/start porque um build de produção
 * deixa arquivos com fingerprint (ex.: layout.<hash>.css) que o servidor
 * dev não consegue servir, causando 404 em CSS e perda total de estilos
 * em /login, /portal/login e /equipe/inicio. Limpar garante que dev e
 * production não se contaminem.
 */
const buildDirs = [
  path.join(appRoot, '.next'),
  path.join(appRoot, '.next-dev'),
  path.join(appRoot, 'tmp', 'posto-web'),
  path.join(appRoot, 'tmp', 'posto-web-next'),
  path.join(appRoot, 'tmp', 'posto-web-next-build'),
  '/tmp/posto-web',
  '/tmp/posto-web-next',
  '/tmp/posto-web-next-build',
]

await Promise.all(
  buildDirs.map(async (target) => {
    try {
      await rm(target, { force: true, recursive: true })
      console.log(`[apps/web] build limpo: ${target}`)
    } catch (error) {
      console.warn(`[apps/web] nao foi possivel limpar ${target}:`, error)
    }
  })
)
