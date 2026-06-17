'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
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
  // Sem empresa cadastrada (tenant novo), começa já no modo "criar nova".
  const [modoEmpresa, setModoEmpresa] = useState<'existente' | 'nova'>(
    empresas.length > 0 ? 'existente' : 'nova',
  )

  const INPUT =
    'w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring'

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
            <label className="text-sm font-medium">
              Empresa <span className="text-red-500">*</span>
            </label>

            {/* Modo da empresa — só aparece o seletor se já houver empresas */}
            {empresas.length > 0 && (
              <div className="flex gap-2 pb-1">
                <button
                  type="button"
                  onClick={() => setModoEmpresa('existente')}
                  className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    modoEmpresa === 'existente'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  Empresa existente
                </button>
                <button
                  type="button"
                  onClick={() => setModoEmpresa('nova')}
                  className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    modoEmpresa === 'nova'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  + Cadastrar nova empresa
                </button>
              </div>
            )}

            {/* Sinaliza ao servidor qual modo usar */}
            <input type="hidden" name="empresaModo" value={modoEmpresa} />

            {modoEmpresa === 'existente' && empresas.length > 0 ? (
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
              <div className="grid gap-3 rounded-md border border-dashed border-primary/30 bg-primary/[0.03] p-3 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="novaEmpresaRazaoSocial" className="text-xs font-medium text-muted-foreground">
                    Razão social da empresa <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="novaEmpresaRazaoSocial"
                    name="novaEmpresaRazaoSocial"
                    placeholder="Ex: Auto Posto Exemplo LTDA"
                    required={modoEmpresa === 'nova'}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="novaEmpresaCnpj" className="text-xs font-medium text-muted-foreground">
                    CNPJ da empresa <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="novaEmpresaCnpj"
                    name="novaEmpresaCnpj"
                    placeholder="00.000.000/0000-00"
                    required={modoEmpresa === 'nova'}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="novaEmpresaNomeFantasia" className="text-xs font-medium text-muted-foreground">
                    Nome fantasia (opcional)
                  </label>
                  <input
                    id="novaEmpresaNomeFantasia"
                    name="novaEmpresaNomeFantasia"
                    placeholder="Ex: Posto Exemplo"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
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

      {/* ── Caracterização regulatória (alimenta o diagnóstico) ──────────── */}
      <section className="rounded-lg border bg-card p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-base">Caracterização regulatória</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quanto mais preenchido, mais preciso o diagnóstico. Deixe em branco o que não souber — o sistema estima de forma conservadora.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label htmlFor="cnaePrincipal" className="text-sm font-medium">CNAE principal</label>
            <input id="cnaePrincipal" name="cnaePrincipal" placeholder="4731-8/00" className={INPUT} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="situacaoEmpreendimento" className="text-sm font-medium">Situação</label>
            <select id="situacaoEmpreendimento" name="situacaoEmpreendimento" defaultValue="" className={INPUT}>
              <option value="">—</option>
              <option value="PLANEJADO">Planejado</option>
              <option value="IMPLANTACAO">Em implantação</option>
              <option value="OPERACAO">Em operação</option>
              <option value="IRREGULAR">Irregular</option>
              <option value="RENOVACAO">Renovação</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="porte" className="text-sm font-medium">Porte</label>
            <select id="porte" name="porte" defaultValue="" className={INPUT}>
              <option value="">—</option>
              <option value="MEI">MEI</option>
              <option value="ME">ME</option>
              <option value="EPP">EPP</option>
              <option value="MEDIO">Médio</option>
              <option value="GRANDE">Grande</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex items-center gap-2 text-sm pt-6">
            <input type="checkbox" name="possuiCaptacao" className="h-4 w-4" /> Possui captação de água
          </label>
          <div className="space-y-1.5">
            <label htmlFor="tipoCaptacao" className="text-sm font-medium">Tipo de captação</label>
            <select id="tipoCaptacao" name="tipoCaptacao" defaultValue="" className={INPUT}>
              <option value="">—</option>
              <option value="POCO_ARTESIANO">Poço artesiano</option>
              <option value="SUPERFICIAL">Superficial</option>
              <option value="CONCESSIONARIA">Concessionária</option>
              <option value="NENHUMA">Nenhuma</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm pt-6">
            <input type="checkbox" name="captaParaConsumo" className="h-4 w-4" /> Capta para consumo humano
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex items-center gap-2 text-sm pt-6">
            <input type="checkbox" name="possuiSAO" className="h-4 w-4" /> Possui SAO (caixa separadora)
          </label>
          <label className="flex items-center gap-2 text-sm pt-6">
            <input type="checkbox" name="emAPP" className="h-4 w-4" /> Em Área de Preservação (APP)
          </label>
          <div className="space-y-1.5">
            <label htmlFor="areaM2" className="text-sm font-medium">Área do terreno (m²)</label>
            <input type="number" min="0" id="areaM2" name="areaM2" placeholder="800" className={INPUT} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label htmlFor="classeAquifero" className="text-sm font-medium">Aquífero</label>
            <select id="classeAquifero" name="classeAquifero" defaultValue="" className={INPUT}>
              <option value="">—</option>
              <option value="LIVRE_RASO">Livre raso</option>
              <option value="LIVRE_PROFUNDO">Livre profundo</option>
              <option value="CONFINADO">Confinado</option>
              <option value="DESCONHECIDO">Desconhecido</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="tipoSolo" className="text-sm font-medium">Tipo de solo</label>
            <select id="tipoSolo" name="tipoSolo" defaultValue="" className={INPUT}>
              <option value="">—</option>
              <option value="ARENOSO">Arenoso</option>
              <option value="ARGILOSO">Argiloso</option>
              <option value="MISTO">Misto</option>
              <option value="ROCHOSO">Rochoso</option>
              <option value="DESCONHECIDO">Desconhecido</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="profundidadeNivelAguaM" className="text-sm font-medium">Nível d&apos;água (m)</label>
            <input type="number" min="0" step="0.1" id="profundidadeNivelAguaM" name="profundidadeNivelAguaM" placeholder="4" className={INPUT} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label htmlFor="distanciaPocoAbastecimentoM" className="text-sm font-medium">Distância a poço de abast. (m)</label>
            <input type="number" min="0" id="distanciaPocoAbastecimentoM" name="distanciaPocoAbastecimentoM" placeholder="120" className={INPUT} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="distanciaCorpoHidricoM" className="text-sm font-medium">Distância a corpo hídrico (m)</label>
            <input type="number" min="0" id="distanciaCorpoHidricoM" name="distanciaCorpoHidricoM" placeholder="200" className={INPUT} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="classificacaoAreaContaminada" className="text-sm font-medium">Área contaminada?</label>
            <select id="classificacaoAreaContaminada" name="classificacaoAreaContaminada" defaultValue="" className={INPUT}>
              <option value="">—</option>
              <option value="NAO_AVALIADA">Não avaliada</option>
              <option value="SEM_INDICIO">Sem indício</option>
              <option value="SUSPEITA">Suspeita</option>
              <option value="CONTAMINADA">Contaminada</option>
              <option value="REABILITADA">Reabilitada</option>
            </select>
          </div>
        </div>
      </section>

      {/* ── Ações ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <Link
          href="/empreendimentos"
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
        >
          Cancelar
        </Link>
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
