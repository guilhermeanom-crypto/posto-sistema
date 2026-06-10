import type { Metadata } from 'next'
import { TriagemForm } from './triagem-form'

export const metadata: Metadata = { title: 'Triagem Comercial' }

export default function TriagemComercialPage() {
  return <TriagemForm />
}
