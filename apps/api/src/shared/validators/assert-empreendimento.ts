import { prisma } from '../../infra/database/prisma.js'
import { NotFoundError, ValidationError } from '../errors/app-errors.js'
import type { TipoEquipamento } from '@prisma/client'

// ─────────────────────────────────────────────────────────────────────────────
// Garante que o empreendimento existe E pertence ao tenant antes de um create.
// Sem isto, um empreendimentoId inválido estoura a FK do Prisma e vira 500 cru
// em vez de um 404 limpo (e mascara isolamento entre tenants).
// ─────────────────────────────────────────────────────────────────────────────
export async function assertEmpreendimento(
  tenantId: string,
  empreendimentoId: string,
): Promise<void> {
  const emp = await prisma.empreendimento.findFirst({
    where: { id: empreendimentoId, tenantId },
    select: { id: true },
  })
  if (!emp) throw new NotFoundError('Empreendimento', empreendimentoId)
}

function assertMesmoEmpreendimento(
  entidade: string,
  field: string,
  expectedEmpreendimentoId: string,
  actualEmpreendimentoId: string,
) {
  if (expectedEmpreendimentoId !== actualEmpreendimentoId) {
    throw new ValidationError(`${entidade} não pertence ao empreendimento informado`, {
      [field]: [`${entidade} não pertence ao empreendimento informado`],
    })
  }
}

export async function assertProcesso(
  tenantId: string,
  processoId: string,
  opts?: { empreendimentoId?: string },
) {
  const processo = await prisma.processo.findFirst({
    where: { id: processoId, tenantId },
    select: { id: true, empreendimentoId: true },
  })
  if (!processo) throw new NotFoundError('Processo', processoId)
  if (opts?.empreendimentoId) {
    assertMesmoEmpreendimento('Processo', 'processoId', opts.empreendimentoId, processo.empreendimentoId)
  }
  return processo
}

export async function assertCondicionante(
  tenantId: string,
  condicionanteId: string,
  opts?: { empreendimentoId?: string; processoId?: string },
) {
  const condicionante = await prisma.condicionante.findFirst({
    where: { id: condicionanteId, tenantId },
    select: { id: true, empreendimentoId: true, processoId: true },
  })
  if (!condicionante) throw new NotFoundError('Condicionante', condicionanteId)
  if (opts?.empreendimentoId) {
    assertMesmoEmpreendimento(
      'Condicionante',
      'condicionanteId',
      opts.empreendimentoId,
      condicionante.empreendimentoId,
    )
  }
  if (opts?.processoId && condicionante.processoId !== opts.processoId) {
    throw new ValidationError('Condicionante não pertence ao processo informado', {
      condicionanteId: ['Condicionante não pertence ao processo informado'],
    })
  }
  return condicionante
}

export async function assertPocoMonitoramento(
  tenantId: string,
  pocoMonitoramentoId: string,
  opts?: { empreendimentoId?: string },
) {
  const poco = await prisma.pocoMonitoramento.findFirst({
    where: { id: pocoMonitoramentoId, tenantId },
    select: { id: true, empreendimentoId: true },
  })
  if (!poco) throw new NotFoundError('PoçoMonitoramento', pocoMonitoramentoId)
  if (opts?.empreendimentoId) {
    assertMesmoEmpreendimento(
      'PoçoMonitoramento',
      'pocoMonitoramentoId',
      opts.empreendimentoId,
      poco.empreendimentoId,
    )
  }
  return poco
}

export async function assertFuncionario(
  tenantId: string,
  funcionarioId: string,
  opts?: { empreendimentoId?: string },
) {
  const funcionario = await prisma.funcionario.findFirst({
    where: { id: funcionarioId, tenantId },
    select: { id: true, empreendimentoId: true, cpf: true, nome: true },
  })
  if (!funcionario) throw new NotFoundError('Funcionário', funcionarioId)
  if (opts?.empreendimentoId) {
    assertMesmoEmpreendimento(
      'Funcionário',
      'funcionarioId',
      opts.empreendimentoId,
      funcionario.empreendimentoId,
    )
  }
  return funcionario
}

export async function assertTanque(
  tenantId: string,
  tanqueId: string,
  opts?: { empreendimentoId?: string },
) {
  const tanque = await prisma.tanque.findFirst({
    where: { id: tanqueId, tenantId },
    select: { id: true, empreendimentoId: true },
  })
  if (!tanque) throw new NotFoundError('Tanque', tanqueId)
  if (opts?.empreendimentoId) {
    assertMesmoEmpreendimento('Tanque', 'tanqueId', opts.empreendimentoId, tanque.empreendimentoId)
  }
  return tanque
}

export async function assertTransportadora(tenantId: string, transportadoraId: string) {
  const transportadora = await prisma.transportadora.findFirst({
    where: { id: transportadoraId, tenantId },
    select: { id: true },
  })
  if (!transportadora) throw new NotFoundError('Transportadora', transportadoraId)
  return transportadora
}

export async function assertDocumento(
  tenantId: string,
  documentoId: string,
  opts?: { empreendimentoId?: string },
) {
  const documento = await prisma.documento.findFirst({
    where: { id: documentoId, tenantId },
    select: { id: true, empreendimentoId: true },
  })
  if (!documento) throw new NotFoundError('Documento', documentoId)
  if (opts?.empreendimentoId) {
    assertMesmoEmpreendimento(
      'Documento',
      'documentoId',
      opts.empreendimentoId,
      documento.empreendimentoId,
    )
  }
  return documento
}

export async function assertEquipamentoDoEmpreendimento(
  tenantId: string,
  empreendimentoId: string,
  equipamentoTipo: TipoEquipamento,
  equipamentoId: string,
) {
  switch (equipamentoTipo) {
    case 'TANQUE':
      await assertTanque(tenantId, equipamentoId, { empreendimentoId })
      return
    case 'BOMBA': {
      const bomba = await prisma.bombaAbastecimento.findFirst({
        where: { id: equipamentoId, tenantId },
        select: { id: true, empreendimentoId: true },
      })
      if (!bomba) throw new NotFoundError('BombaAbastecimento', equipamentoId)
      assertMesmoEmpreendimento('BombaAbastecimento', 'equipamentoId', empreendimentoId, bomba.empreendimentoId)
      return
    }
    default:
      return
  }
}
