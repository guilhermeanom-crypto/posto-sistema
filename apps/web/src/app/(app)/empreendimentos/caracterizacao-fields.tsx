// Campos de CARACTERIZAÇÃO regulatória (discriminadores do motor — Blueprint 101).
// Compartilhado entre o cadastro novo e a edição. Inputs nativos (FormData):
// os `name` batem com criar/atualizarEmpreendimentoSchema. Tudo opcional.

export interface CaracterizacaoValues {
  cnaePrincipal?: string | null
  situacaoEmpreendimento?: string | null
  porte?: string | null
  areaM2?: number | string | null
  possuiCaptacao?: boolean | null
  tipoCaptacao?: string | null
  possuiSAO?: boolean | null
  classeAquifero?: string | null
  profundidadeNivelAguaM?: number | string | null
  tipoSolo?: string | null
  distanciaPocoAbastecimentoM?: number | string | null
  distanciaCorpoHidricoM?: number | string | null
  emAPP?: boolean | null
  captaParaConsumo?: boolean | null
  classificacaoAreaContaminada?: string | null
}

const INPUT =
  'w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring'

const str = (v: unknown) => (v == null ? '' : String(v))

export function CaracterizacaoFields({ values = {} }: { values?: CaracterizacaoValues }) {
  const v = values
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label htmlFor="cnaePrincipal" className="text-sm font-medium">CNAE principal</label>
          <input id="cnaePrincipal" name="cnaePrincipal" defaultValue={str(v.cnaePrincipal)} placeholder="4731-8/00" className={INPUT} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="situacaoEmpreendimento" className="text-sm font-medium">Situação</label>
          <select id="situacaoEmpreendimento" name="situacaoEmpreendimento" defaultValue={str(v.situacaoEmpreendimento)} className={INPUT}>
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
          <select id="porte" name="porte" defaultValue={str(v.porte)} className={INPUT}>
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
          <input type="checkbox" name="possuiCaptacao" defaultChecked={!!v.possuiCaptacao} className="h-4 w-4" /> Possui captação de água
        </label>
        <div className="space-y-1.5">
          <label htmlFor="tipoCaptacao" className="text-sm font-medium">Tipo de captação</label>
          <select id="tipoCaptacao" name="tipoCaptacao" defaultValue={str(v.tipoCaptacao)} className={INPUT}>
            <option value="">—</option>
            <option value="POCO_ARTESIANO">Poço artesiano</option>
            <option value="SUPERFICIAL">Superficial</option>
            <option value="CONCESSIONARIA">Concessionária</option>
            <option value="NENHUMA">Nenhuma</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm pt-6">
          <input type="checkbox" name="captaParaConsumo" defaultChecked={!!v.captaParaConsumo} className="h-4 w-4" /> Capta para consumo humano
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="flex items-center gap-2 text-sm pt-6">
          <input type="checkbox" name="possuiSAO" defaultChecked={!!v.possuiSAO} className="h-4 w-4" /> Possui SAO (caixa separadora)
        </label>
        <label className="flex items-center gap-2 text-sm pt-6">
          <input type="checkbox" name="emAPP" defaultChecked={!!v.emAPP} className="h-4 w-4" /> Em Área de Preservação (APP)
        </label>
        <div className="space-y-1.5">
          <label htmlFor="areaM2" className="text-sm font-medium">Área do terreno (m²)</label>
          <input type="number" min="0" id="areaM2" name="areaM2" defaultValue={str(v.areaM2)} placeholder="800" className={INPUT} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label htmlFor="classeAquifero" className="text-sm font-medium">Aquífero</label>
          <select id="classeAquifero" name="classeAquifero" defaultValue={str(v.classeAquifero)} className={INPUT}>
            <option value="">—</option>
            <option value="LIVRE_RASO">Livre raso</option>
            <option value="LIVRE_PROFUNDO">Livre profundo</option>
            <option value="CONFINADO">Confinado</option>
            <option value="DESCONHECIDO">Desconhecido</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="tipoSolo" className="text-sm font-medium">Tipo de solo</label>
          <select id="tipoSolo" name="tipoSolo" defaultValue={str(v.tipoSolo)} className={INPUT}>
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
          <input type="number" min="0" step="0.1" id="profundidadeNivelAguaM" name="profundidadeNivelAguaM" defaultValue={str(v.profundidadeNivelAguaM)} placeholder="4" className={INPUT} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label htmlFor="distanciaPocoAbastecimentoM" className="text-sm font-medium">Distância a poço de abast. (m)</label>
          <input type="number" min="0" id="distanciaPocoAbastecimentoM" name="distanciaPocoAbastecimentoM" defaultValue={str(v.distanciaPocoAbastecimentoM)} placeholder="120" className={INPUT} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="distanciaCorpoHidricoM" className="text-sm font-medium">Distância a corpo hídrico (m)</label>
          <input type="number" min="0" id="distanciaCorpoHidricoM" name="distanciaCorpoHidricoM" defaultValue={str(v.distanciaCorpoHidricoM)} placeholder="200" className={INPUT} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="classificacaoAreaContaminada" className="text-sm font-medium">Área contaminada?</label>
          <select id="classificacaoAreaContaminada" name="classificacaoAreaContaminada" defaultValue={str(v.classificacaoAreaContaminada)} className={INPUT}>
            <option value="">—</option>
            <option value="NAO_AVALIADA">Não avaliada</option>
            <option value="SEM_INDICIO">Sem indício</option>
            <option value="SUSPEITA">Suspeita</option>
            <option value="CONTAMINADA">Contaminada</option>
            <option value="REABILITADA">Reabilitada</option>
          </select>
        </div>
      </div>
    </div>
  )
}
