import { Compass, Globe, MousePointerClick } from 'lucide-react'

export function SiteExperienceMockup() {
  return (
    <div className="product-surface h-full">
      <div className="panel-chrome">
        <Globe className="h-3.5 w-3.5 text-primary" />
        <span className="text-[11px] font-semibold tracking-tight">Site Institucional</span>
        <span className="mono-tag ml-1">/</span>
        <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
          <Compass className="h-3 w-3" />
          captação · marca · entrada
        </span>
      </div>

      <div className="space-y-3 p-4">
        <div className="rounded-md border border-border/70 bg-[linear-gradient(135deg,rgba(243,146,0,0.12),rgba(0,158,60,0.08))] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Hábilis Ambiental
          </p>
          <h3 className="mt-1 text-[15px] font-bold tracking-tight text-foreground">
            Inteligência regulatória aplicada a operações complexas
          </h3>
          <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
            Entrada pública para apresentar método, setores atendidos, serviços e direcionar cada
            perfil para sua interface correta.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Serviços', value: '6 frentes' },
            { label: 'Setores', value: 'multissetorial' },
            { label: 'Clientes', value: '+200' },
            { label: 'Entradas', value: '4 superfícies' },
          ].map((item) => (
            <div key={item.label} className="rounded-md border border-border/70 bg-white/75 px-2.5 py-2">
              <p className="text-[11px] font-black tracking-tight text-foreground">{item.value}</p>
              <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                {item.label}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-md border border-border/70 bg-white/70 p-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Jornadas conectadas
            </p>
            <MousePointerClick className="h-3 w-3 text-primary" />
          </div>
          <ul className="mt-2 space-y-1.5">
            {[
              'Visitante conhece a Hábilis e entende o escopo',
              'Cliente entra no portal com leitura executiva',
              'Equipe de campo registra checklist e evidência',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-[10px] leading-relaxed text-foreground">
                <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
