import { configDefaults, defineConfig } from 'vitest/config'

const integrationEnabled = process.env.RUN_API_INTEGRATION_TESTS === '1'

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.ts'],
    exclude: integrationEnabled
      ? configDefaults.exclude
      : [...configDefaults.exclude, 'src/modules/**/__tests__/**'],
    // A trilha integrada sobe Fastify + Prisma reais e usa seed compartilhado.
    // Rodar arquivos em paralelo torna a suíte instável no ambiente atual.
    fileParallelism: integrationEnabled ? false : true,
  },
})
