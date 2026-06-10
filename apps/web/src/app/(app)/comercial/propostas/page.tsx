'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { listarPropostasComerciais } from './actions'
import type { PropostaComercialResumo } from './shared'

export default function PropostasPage() {
  const [propostas, setPropostas] = useState<PropostaComercialResumo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadPropostas() {
      try {
        const res = await listarPropostasComerciais({})
        setPropostas(res.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar propostas')
      } finally {
        setLoading(false)
      }
    }
    loadPropostas()
  }, [])

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Propostas Comerciais</h1>
        <p>Carregando...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Propostas Comerciais</h1>
        <p className="text-red-600">Erro: {error}</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Propostas Comerciais</h1>
      {propostas.length === 0 ? (
        <p>Nenhuma proposta encontrada.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 border">Número</th>
                <th className="px-4 py-2 border">Status</th>
                <th className="px-4 py-2 border">Origem</th>
                <th className="px-4 py-2 border">Nome Lead</th>
                <th className="px-4 py-2 border">Empresa Lead</th>
                <th className="px-4 py-2 border">Município/UF</th>
                <th className="px-4 py-2 border">Total Base</th>
                <th className="px-4 py-2 border">Total Mínimo</th>
                <th className="px-4 py-2 border">Total Máximo</th>
                <th className="px-4 py-2 border">Data Validade</th>
                <th className="px-4 py-2 border">Data Criação</th>
                <th className="px-4 py-2 border">Qtd Itens</th>
                <th className="px-4 py-2 border">Risco</th>
                <th className="px-4 py-2 border">CNAE Principal</th>
                <th className="px-4 py-2 border">Ações</th>
              </tr>
            </thead>
            <tbody>
              {propostas.map((proposta) => (
                <tr key={proposta.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border">{proposta.numero}</td>
                  <td className="px-4 py-2 border">{proposta.status}</td>
                  <td className="px-4 py-2 border">{proposta.origem}</td>
                  <td className="px-4 py-2 border">{proposta.nomeLead || '-'}</td>
                  <td className="px-4 py-2 border">{proposta.empresaLead || '-'}</td>
                  <td className="px-4 py-2 border">{proposta.municipio ? `${proposta.municipio}/${proposta.uf}` : proposta.uf}</td>
                  <td className="px-4 py-2 border">R$ {proposta.totalBase.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-2 border">R$ {proposta.totalMinimo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-2 border">R$ {proposta.totalMaximo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-2 border">{new Date(proposta.dataValidade).toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-2 border">{new Date(proposta.criadoEm).toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-2 border">{proposta.itensQuantidade}</td>
                  <td className="px-4 py-2 border">{proposta.riscoNivel}</td>
                  <td className="px-4 py-2 border">{proposta.cnaePrincipalCodigo}</td>
                  <td className="px-4 py-2 border">
                    <Link href={`/comercial/propostas/${proposta.id}`} className="text-blue-600 hover:underline">
                      Ver Detalhes
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}