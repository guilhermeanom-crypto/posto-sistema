'use client'

import { useActionState } from 'react'
import { criarEmpreendimentoAction } from './actions'

const UFS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]

const TIPOS_EMPREENDIMENTO = [
  { value: 'revendedor', label: 'Posto Revendedor Varejista' },
  { value: 'distribuidor', label: 'Distribuidora' },
  { value: 'transportador', label: 'Transportadora' },
  { value: 'outros', label: 'Outros' },
]

interface Props {
  empresas: Array<{ id: string; nome: string; razaoSocial?: string; cnpj?: string }>
}

export function NovoEmpreendimentoForm({ empresas }: Props) {
  const [state, action, pending] = useActionState(criarEmpreendimentoAction, null)

  return (
    <form action={action} className="space-y-6">
      {state?.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.error}
        </div>
      )}

      {/* ── Identificação ───────────────────────────────────────────────── */}
      <section className="rounded-lg border bg-card p-6 space-y-4">
        <h2 className="font-semibold text-base">Identificação</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="empresaId" className="text-sm font-medium">
              Empresa <span className="text-red-500">*</span>
            </label>
            {empresas.length > 0 ? (
              <select
                id="empresaId"
                name="empresaId"
                required
                defaultValue=""
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="" disabled>Selecione a empresa</option>
                {empresas.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.razaoSocial ?? e.nome}{e.cnpj ? ` (${e.cnpj})` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id="empresaId"
                name="empresaId"
                placeholder="ID da empresa (UUID)"
                required
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            )}
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="nome" className="text-sm font-medium">
              Razão Social / Nome <span className="text-red-500">*</span>
            </label>
            <input
              id="nome"
              name="nome"
              required
              minLength={2}
              placeholder="Ex: Auto Posto Exemplo LTDA"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="nomeFantasia" className="text-sm font-medium">Nome Fantasia</label>
            <input
              id="nomeFantasia"
              name="nomeFantasia"
              placeholder="Ex: Posto Exemplo"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="cnpj" className="text-sm font-medium">CNPJ</label>
            <input
              id="cnpj"
              name="cnpj"
              placeholder="00.000.000/0000-00"
              inputMode="numeric"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="codigoInterno" className="text-sm font-medium">Código Interno</label>
            <input
              id="codigoInterno"
              name="codigoInterno"
              placeholder="Ex: POST-042"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="bandeira" className="text-sm font-medium">Bandeira</label>
            <input
              id="bandeira"
              name="bandeira"
              placeholder="Ex: Shell, Ipiranga, Branca…"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="tipo" className="text-sm font-medium">Tipo de empreendimento</label>
            <select
              id="tipo"
              name="tipo"
              defaultValue="revendedor"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {TIPOS_EMPREENDIMENTO.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="dataInicioOperacao" className="text-sm font-medium">
              Início de operação
            </label>
            <input
              type="date"
              id="dataInicioOperacao"
              name="dataInicioOperacao"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Atividade padrão embutida - campo oculto */}
        <input type="hidden" name="atividades" value="Revendedor varejista de combustíveis" />
      </section>

      {/* ── Endereço ────────────────────────────────────────────────────── */}
      <section className="rounded-lg border bg-card p-6 space-y-4">
        <h2 className="font-semibold text-base">Endereço</h2>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="logradouro" className="text-sm font-medium">
              Logradouro <span className="text-red-500">*</span>
            </label>
            <input
              id="logradouro"
              name="logradouro"
              required
              placeholder="Av. Paulista"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="numero" className="text-sm font-medium">
              Número <span className="text-red-500">*</span>
            </label>
            <input
              id="numero"
              name="numero"
              required
              placeholder="1000"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="complemento" className="text-sm font-medium">Complemento</label>
            <input
              id="complemento"
              name="complemento"
              placeholder="Loja A"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="bairro" className="text-sm font-medium">
              Bairro <span className="text-red-500">*</span>
            </label>
            <input
              id="bairro"
              name="bairro"
              required
              placeholder="Bela Vista"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="cep" className="text-sm font-medium">
              CEP <span className="text-red-500">*</span>
            </label>
            <input
              id="cep"
              name="cep"
              required
              placeholder="01310-100"
              inputMode="numeric"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="cidade" className="text-sm font-medium">
              Cidade <span className="text-red-500">*</span>
            </label>
            <input
              id="cidade"
              name="cidade"
              required
              placeholder="São Paulo"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="estado" className="text-sm font-medium">
              UF <span className="text-red-500">*</span>
            </label>
            <select
              id="estado"
              name="estado"
              required
              defaultValue=""
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="" disabled>UF</option>
              {UFS.map((uf) => (
                <option key={uf} value={uf}>{uf}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* ── Contato e RT ────────────────────────────────────────────────── */}
      <section className="rounded-lg border bg-card p-6 space-y-4">
        <h2 className="font-semibold text-base">Contato e Responsável Técnico</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="contatoEmail" className="text-sm font-medium">E-mail de contato</label>
            <input
              type="email"
              id="contatoEmail"
              name="contatoEmail"
              placeholder="contato@posto.com.br"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="contatoTelefone" className="text-sm font-medium">Telefone</label>
            <input
              id="contatoTelefone"
              name="contatoTelefone"
              placeholder="(11) 99999-9999"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="responsavelTecnicoNome" className="text-sm font-medium">
              Responsável Técnico
            </label>
            <input
              id="responsavelTecnicoNome"
              name="responsavelTecnicoNome"
              placeholder="Nome do engenheiro / RT"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="responsavelTecnicoCrea" className="text-sm font-medium">CREA / CAU</label>
            <input
              id="responsavelTecnicoCrea"
              name="responsavelTecnicoCrea"
              placeholder="CREA-SP 123456"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Dica: o sistema aceita CEP e CNPJ com máscara, mas envia os números normalizados automaticamente.
        </p>
      </section>

      {/* ── Ações ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <a
          href="/empreendimentos"
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
        >
          Cancelar
        </a>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
          {pending ? 'Salvando…' : 'Salvar e continuar →'}
        </button>
      </div>
    </form>
  )
}
