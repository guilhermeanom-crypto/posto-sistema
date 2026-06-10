import { Worker } from 'bullmq'
import PDFDocument from 'pdfkit'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { redis } from '../infra/redis.js'
import { prisma } from '../infra/prisma.js'
import { s3 } from '../infra/s3.js'
import { env } from '../config/env.js'

function pdfToBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    doc.on('data', (c: Buffer) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
    doc.end()
  })
}

function formatDate(d: Date | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR')
}

async function uploadS3(key: string, buffer: Buffer, contentType: string) {
  await s3.send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  )
}

export function criarEntregavelWorker(concurrency = 2) {
  return new Worker(
    'entregaveis',
    async (job) => {
      const { entregavelId, tenantId } = job.data as { entregavelId: string; tenantId: string }

      const entregavel = await prisma.entregavel.findFirst({
        where: { id: entregavelId, tenantId },
        include: {
          ordemServico: {
            select: {
              numero: true,
              titulo: true,
              escopo: true,
              tipo: true,
              dataPlanejada: true,
              contrato: { select: { numero: true } },
            },
          },
          empreendimento: {
            select: { nome: true, nomeFantasia: true, cidade: true, estado: true },
          },
        },
      })

      if (!entregavel) {
        console.warn(`[entregavel] Entregável ${entregavelId} não encontrado`)
        return
      }

      if (entregavel.status !== 'PENDENTE') {
        console.warn(`[entregavel] Entregável ${entregavelId} não está PENDENTE (${entregavel.status})`)
        return
      }

      await prisma.entregavel.update({
        where: { id: entregavelId },
        data: { status: 'GERANDO' },
      })

      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 })

        doc.fontSize(18).font('Helvetica-Bold').text('Entregável', { align: 'center' })
        doc.moveDown(0.5)
        doc.fontSize(14).font('Helvetica').text(entregavel.titulo, { align: 'center' })
        doc.moveDown(1)

        doc
          .fontSize(10)
          .font('Helvetica')
          .text(`Número: ${entregavel.numero}`)
          .text(`Tipo: ${entregavel.tipo.replace(/_/g, ' ')}`)
          .text(`Data de emissão: ${formatDate(new Date())}`)
        doc.moveDown(0.5)

        doc.font('Helvetica-Bold').text('Empreendimento')
        doc
          .font('Helvetica')
          .text(
            `${entregavel.empreendimento.nomeFantasia ?? entregavel.empreendimento.nome} — ${entregavel.empreendimento.cidade}/${entregavel.empreendimento.estado}`,
          )
        doc.moveDown(0.5)

        doc.font('Helvetica-Bold').text('Ordem de Serviço')
        doc
          .font('Helvetica')
          .text(`${entregavel.ordemServico.numero} — ${entregavel.ordemServico.titulo}`)
          .text(`Tipo: ${entregavel.ordemServico.tipo.replace(/_/g, ' ')}`)
          .text(`Data planejada: ${formatDate(entregavel.ordemServico.dataPlanejada)}`)
        if (entregavel.ordemServico.contrato) {
          doc.text(`Contrato: ${entregavel.ordemServico.contrato.numero}`)
        }
        doc.moveDown(0.5)

        doc.font('Helvetica-Bold').text('Escopo')
        doc.font('Helvetica').text(entregavel.ordemServico.escopo)
        doc.moveDown(0.5)

        if (entregavel.descricao) {
          doc.font('Helvetica-Bold').text('Descrição do Entregável')
          doc.font('Helvetica').text(entregavel.descricao)
          doc.moveDown(0.5)
        }

        doc.moveDown(2)
        doc
          .fontSize(8)
          .fillColor('#999')
          .text(`Gerado automaticamente pelo sistema Hábilis em ${new Date().toLocaleString('pt-BR')}`, {
            align: 'center',
          })

        const buffer = await pdfToBuffer(doc)
        const nomeArquivo = `${entregavel.numero}.pdf`
        const s3Key = `entregaveis/${tenantId}/${entregavelId}/${nomeArquivo}`

        await uploadS3(s3Key, buffer, 'application/pdf')

        await prisma.entregavel.update({
          where: { id: entregavelId },
          data: {
            status: 'DISPONIVEL',
            s3Key,
            nomeArquivo,
            tamanhoBytes: buffer.length,
            geradoEm: new Date(),
          },
        })

        console.log(`[entregavel] ✅ ${entregavel.numero} gerado (${buffer.length} bytes)`)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro desconhecido na geração'
        console.error(`[entregavel] ❌ ${entregavel.numero} falhou:`, msg)

        await prisma.entregavel.update({
          where: { id: entregavelId },
          data: { status: 'ERRO', erroMsg: msg.slice(0, 500) },
        })

        throw err
      }
    },
    { connection: redis, concurrency },
  )
}
