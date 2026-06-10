import { describe } from 'vitest'

const integrationEnabled = process.env.RUN_API_INTEGRATION_TESTS === '1'

export function describeIntegration(name: string, definition: () => void) {
  if (integrationEnabled) {
    return describe(name, definition)
  }

  return describe.skip(name, definition)
}

export async function assertIntegrationDatabaseAvailable(prisma: {
  $queryRaw: <T = unknown>(query: TemplateStringsArray, ...values: unknown[]) => Promise<T>
}) {
  try {
    await prisma.$queryRaw`SELECT 1`
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(
      [
        'Infra de banco indisponível para os testes de integração da API.',
        'Suba o PostgreSQL antes de rodar a suíte:',
        '  docker compose up -d postgres',
        `Detalhe original: ${message}`,
      ].join('\n'),
    )
  }
}
