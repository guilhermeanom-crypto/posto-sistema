import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { CaracterizacaoEditForm } from './caracterizacao-edit-form'
import type { CaracterizacaoValues } from '../../caracterizacao-fields'

interface Props { params: Promise<{ id: string }> }

export const metadata = { title: 'Caracterização do posto' }

export default async function EditarCaracterizacaoPage({ params }: Props) {
  const { id } = await params
  const token = await getAccessToken()
  if (!token) return null

  let emp: Record<string, unknown>
  try {
    emp = (await api.get<{ data: Record<string, unknown> }>(`/empreendimentos/${id}`, token)).data
  } catch {
    notFound()
  }

  const values: CaracterizacaoValues = {
    cnaePrincipal: emp.cnaePrincipal as string | null,
    situacaoEmpreendimento: emp.situacaoEmpreendimento as string | null,
    porte: emp.porte as string | null,
    areaM2: emp.areaM2 as number | string | null,
    possuiCaptacao: emp.possuiCaptacao as boolean | null,
    tipoCaptacao: emp.tipoCaptacao as string | null,
    possuiSAO: emp.possuiSAO as boolean | null,
    classeAquifero: emp.classeAquifero as string | null,
    profundidadeNivelAguaM: emp.profundidadeNivelAguaM as number | string | null,
    tipoSolo: emp.tipoSolo as string | null,
    distanciaPocoAbastecimentoM: emp.distanciaPocoAbastecimentoM as number | string | null,
    distanciaCorpoHidricoM: emp.distanciaCorpoHidricoM as number | string | null,
    emAPP: emp.emAPP as boolean | null,
    captaParaConsumo: emp.captaParaConsumo as boolean | null,
    classificacaoAreaContaminada: emp.classificacaoAreaContaminada as string | null,
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <Link
          href={`/empreendimentos/${id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao posto
        </Link>
        <h1 className="text-xl font-bold mt-2">Caracterização — {String(emp.nome ?? '')}</h1>
        <p className="text-sm text-muted-foreground">
          {String(emp.cidade ?? '')}/{String(emp.estado ?? '')}
        </p>
      </div>
      <CaracterizacaoEditForm empreendimentoId={id} values={values} />
    </div>
  )
}
