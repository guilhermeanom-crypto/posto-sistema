import PDFDocument from 'pdfkit'
import type {
  OrigemPropostaComercial,
  PropostaComercialDetalhePublico,
  StatusPropostaComercial,
} from './propostas.types.js'

const COLORS = {
  text: '#111827',
  muted: '#4b5563',
  subtle: '#6b7280',
  line: '#d1d5db',
  panel: '#f8fafc',
  panelBorder: '#cbd5e1',
  accent: '#1d4ed8',
  accentSoft: '#dbeafe',
  warningSoft: '#fff7ed',
  warningBorder: '#fdba74',
}

const STATUS_LABELS: Record<StatusPropostaComercial, string> = {
  RASCUNHO: 'Rascunho',
  PRONTA: 'Pronta',
  ENVIADA: 'Enviada',
  EM_NEGOCIACAO: 'Em negociacao',
  APROVADA: 'Aprovada',
  REJEITADA: 'Rejeitada',
  EXPIRADA: 'Expirada',
  CANCELADA: 'Cancelada',
}

const ORIGEM_LABELS: Record<OrigemPropostaComercial, string> = {
  TRIAGEM_CNAE: 'Triagem CNAE',
  CRM: 'CRM',
  ONBOARDING: 'Onboarding',
  MANUAL: 'Manual',
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(value)
}

function textOrFallback(value: string | null | undefined, fallback = '-') {
  const normalized = value?.trim()
  return normalized ? normalized : fallback
}

function ensureSpace(doc: PDFKit.PDFDocument, minHeight = 72) {
  const bottomLimit = doc.page.height - doc.page.margins.bottom
  if (doc.y + minHeight > bottomLimit) {
    doc.addPage()
  }
}

function drawSectionTitle(doc: PDFKit.PDFDocument, title: string) {
  ensureSpace(doc, 36)
  doc.x = doc.page.margins.left

  doc
    .moveDown(0.35)
    .font('Helvetica-Bold')
    .fontSize(15)
    .fillColor(COLORS.text)
    .text(title)

  const dividerY = doc.y + 5
  doc
    .moveTo(doc.page.margins.left, dividerY)
    .lineTo(doc.page.width - doc.page.margins.right, dividerY)
    .lineWidth(1)
    .strokeColor(COLORS.line)
    .stroke()

  doc.moveDown(0.6)
}

function drawLabelValue(doc: PDFKit.PDFDocument, label: string, value: string) {
  ensureSpace(doc, 18)
  doc.x = doc.page.margins.left
  doc
    .font('Helvetica-Bold')
    .fontSize(10.5)
    .fillColor(COLORS.text)
    .text(`${label}: `, { continued: true })
    .font('Helvetica')
    .fillColor(COLORS.muted)
    .text(value)
}

function drawBulletList(doc: PDFKit.PDFDocument, items: string[]) {
  if (items.length === 0) {
    doc.x = doc.page.margins.left
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(COLORS.subtle)
      .text('-')
    return
  }

  const left = doc.page.margins.left + 8
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right - 8

  for (const item of items) {
    ensureSpace(doc, 24)
    doc.x = doc.page.margins.left
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(COLORS.muted)
      .text(`- ${item}`, left, doc.y, {
        width,
      })
  }
}

function drawHeader(doc: PDFKit.PDFDocument, proposta: PropostaComercialDetalhePublico) {
  const left = doc.page.margins.left
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right
  const top = doc.y
  const boxHeight = 118
  const colGap = 18
  const leftColWidth = 310
  const rightColX = left + leftColWidth + colGap
  const rightColWidth = width - leftColWidth - colGap - 18

  doc
    .roundedRect(left, top, width, boxHeight, 12)
    .fillAndStroke(COLORS.panel, COLORS.panelBorder)

  doc
    .roundedRect(left, top, 7, boxHeight, 12)
    .fill(COLORS.accent)

  doc
    .font('Helvetica-Bold')
    .fontSize(24)
    .fillColor(COLORS.text)
    .text('Proposta Comercial', left + 20, top + 18, {
      width: leftColWidth - 10,
    })

  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor(COLORS.subtle)
    .text('Documento comercial preliminar para avaliacao inicial.', left + 20, top + 50, {
      width: leftColWidth - 10,
    })

  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor(COLORS.text)
    .text('Numero', left + 20, top + 78)
    .font('Helvetica')
    .fillColor(COLORS.muted)
    .text(proposta.numero, left + 80, top + 78, {
      width: 180,
    })

  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor(COLORS.text)
    .text('Status', rightColX, top + 22)
    .font('Helvetica')
    .fillColor(COLORS.muted)
    .text(STATUS_LABELS[proposta.status], rightColX, top + 36, {
      width: rightColWidth,
    })

  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor(COLORS.text)
    .text('Origem', rightColX, top + 54)
    .font('Helvetica')
    .fillColor(COLORS.muted)
    .text(ORIGEM_LABELS[proposta.origem], rightColX, top + 68, {
      width: rightColWidth,
    })

  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor(COLORS.text)
    .text('Data de emissao', rightColX, top + 86)
 
  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor(COLORS.muted)
    .text(formatDate(proposta.criadoEm), rightColX, top + 100, {
      width: 92,
    })

  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor(COLORS.text)
    .text('Validade', rightColX + 108, top + 86)

  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor(COLORS.muted)
    .text(formatDate(proposta.dataValidade), rightColX + 108, top + 100, {
      width: rightColWidth - 108,
    })

  doc.y = top + boxHeight + 10
  doc.x = doc.page.margins.left
}

function drawItemBlock(doc: PDFKit.PDFDocument, item: PropostaComercialDetalhePublico['itens'][number], index: number) {
  doc.font('Helvetica-Bold').fontSize(11.5)
  const title = `${index + 1}. ${item.codigoServico} - ${item.nomeServico}`
  const left = doc.page.margins.left
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right
  const innerLeft = left + 14
  const innerWidth = width - 28
  const titleHeight = doc.heightOfString(title, {
    width: innerWidth,
  })

  doc.font('Helvetica').fontSize(9.5)
  const categoryText = `Categoria: ${item.categoriaServico}`
  const categoryHeight = doc.heightOfString(categoryText, {
    width: innerWidth,
  })

  const contentOffsetY = 16 + titleHeight + 8 + categoryHeight + 8
  const cardHeight = Math.max(74, contentOffsetY + 24)

  ensureSpace(doc, cardHeight + 14)
  const top = doc.y
  const adjustedBottomRowY = top + contentOffsetY

  doc
    .roundedRect(left, top, width, cardHeight, 10)
    .lineWidth(1)
    .fillAndStroke('#ffffff', COLORS.line)

  doc
    .font('Helvetica-Bold')
    .fontSize(11.5)
    .fillColor(COLORS.text)
    .text(title, innerLeft, top + 16, {
      width: innerWidth,
    })

  doc
    .font('Helvetica')
    .fontSize(9.5)
    .fillColor(COLORS.muted)
    .text(categoryText, innerLeft, top + 16 + titleHeight + 8, {
      width: innerWidth,
    })

  const col1 = innerLeft
  const col2 = innerLeft + 150
  const col3 = innerLeft + 255
  const col4 = innerLeft + 385

  doc
    .font('Helvetica')
    .fontSize(9.5)
    .fillColor(COLORS.muted)
    .text(`Decisao: ${item.decisao}`, col1, adjustedBottomRowY, { width: 140 })
    .text(`Quantidade: ${item.quantidade}`, col2, adjustedBottomRowY, { width: 95 })
    .text(`Preco aplicado: ${formatCurrency(item.precoAplicadoUnitario)}`, col3, adjustedBottomRowY, { width: 120 })
    .text(`Valor da linha: ${formatCurrency(item.valorAplicadoLinha)}`, col4, adjustedBottomRowY, {
      width: innerLeft + innerWidth - col4,
      align: 'right',
    })

  doc.y = top + cardHeight + 10
}

function drawTotalsBox(doc: PDFKit.PDFDocument, proposta: PropostaComercialDetalhePublico) {
  drawSectionTitle(doc, 'Totais')
  ensureSpace(doc, 118)

  const left = doc.page.margins.left
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right
  const top = doc.y
  const rowHeight = 24
  const boxHeight = 84

  doc
    .roundedRect(left, top, width, boxHeight, 10)
    .fillAndStroke(COLORS.accentSoft, COLORS.panelBorder)

  const rows = [
    ['Total minimo', formatCurrency(proposta.totalMinimo)],
    ['Total base', formatCurrency(proposta.totalBase)],
    ['Total maximo', formatCurrency(proposta.totalMaximo)],
  ] as const

  rows.forEach(([label, value], index) => {
    const rowY = top + 12 + index * rowHeight

    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor(COLORS.text)
      .text(label, left + 16, rowY, {
        width: 150,
      })

    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor(COLORS.accent)
      .text(value, left + 180, rowY, {
        width: width - 196,
        align: 'right',
      })

    if (index < rows.length - 1) {
      doc
        .moveTo(left + 16, rowY + 18)
        .lineTo(left + width - 16, rowY + 18)
        .lineWidth(0.8)
        .strokeColor('#bfdbfe')
        .stroke()
    }
  })

  doc.y = top + boxHeight + 12
}

function drawFooterNotice(doc: PDFKit.PDFDocument) {
  ensureSpace(doc, 104)

  const left = doc.page.margins.left
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right
  const top = doc.y
  const boxHeight = 90

  doc
    .roundedRect(left, top, width, boxHeight, 10)
    .fillAndStroke(COLORS.warningSoft, COLORS.warningBorder)

  doc
    .font('Helvetica-Bold')
    .fontSize(10.5)
    .fillColor(COLORS.text)
    .text('Observacoes importantes', left + 16, top + 14)

  const notes = [
    'Esta proposta comercial e preliminar e nao substitui contrato, pedido formal ou ordem de servico.',
    'Os valores e o escopo final permanecem sujeitos a conferencia tecnica, documental e locacional.',
    'A validade comercial desta proposta depende da manutencao das premissas informadas na triagem inicial.',
  ]

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(COLORS.muted)

  notes.forEach((note, index) => {
    doc.text(`- ${note}`, left + 16, top + 32 + index * 15, {
      width: width - 32,
    })
  })

  doc.y = top + boxHeight + 8
}

export async function renderPropostaComercialPdf(proposta: PropostaComercialDetalhePublico): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 42,
      compress: false,
      info: {
        Title: `Proposta Comercial ${proposta.numero}`,
        Author: 'Posto Compliance',
        Subject: 'Proposta Comercial',
        Keywords: 'proposta, comercial, pdf',
      },
    })

    const chunks: Buffer[] = []
    doc.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    drawHeader(doc, proposta)

    drawSectionTitle(doc, 'Dados Comerciais')
    drawLabelValue(doc, 'Nome do lead', textOrFallback(proposta.nomeLead))
    drawLabelValue(doc, 'Empresa', textOrFallback(proposta.empresaLead))
    drawLabelValue(doc, 'Email', textOrFallback(proposta.emailContato))
    drawLabelValue(doc, 'Telefone', textOrFallback(proposta.telefoneContato))
    drawLabelValue(
      doc,
      'Municipio/UF',
      proposta.municipio ? `${proposta.municipio}/${proposta.uf}` : proposta.uf,
    )
    drawLabelValue(doc, 'Observacoes comerciais', textOrFallback(proposta.observacoesComerciais))

    drawSectionTitle(doc, 'Diagnostico Resumido')
    drawLabelValue(
      doc,
      'CNAE principal',
      `${proposta.diagnostico.cnaePrincipal.codigo} - ${proposta.diagnostico.cnaePrincipal.descricao}`,
    )
    drawLabelValue(doc, 'Risco', proposta.diagnostico.riscoGeral.nivel)
    drawLabelValue(doc, 'Score', String(proposta.diagnostico.riscoGeral.score))
    drawLabelValue(doc, 'Potencial poluidor', proposta.diagnostico.cnaePrincipal.potencialPoluidor)
    drawLabelValue(doc, 'Licenciamento', proposta.diagnostico.enquadramento.licenciamentoTipo)
    drawLabelValue(
      doc,
      'Orgao competente',
      `${proposta.diagnostico.enquadramento.orgaoCompetente} (${proposta.diagnostico.enquadramento.esfera})`,
    )

    doc.moveDown(0.3)
    doc
      .font('Helvetica-Bold')
      .fontSize(10.5)
      .fillColor(COLORS.text)
      .text('Alertas')
    drawBulletList(doc, proposta.diagnostico.alertas)

    doc.moveDown(0.25)
    doc
      .font('Helvetica-Bold')
      .fontSize(10.5)
      .fillColor(COLORS.text)
      .text('Proximos passos')
    drawBulletList(doc, proposta.diagnostico.proximosPassos)

    drawSectionTitle(doc, 'Itens da Proposta')
    if (proposta.itens.length === 0) {
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor(COLORS.subtle)
        .text('Nenhum item encontrado.')
    } else {
      proposta.itens.forEach((item, index) => drawItemBlock(doc, item, index))
    }

    ensureSpace(doc, 210)
    drawTotalsBox(doc, proposta)
    drawFooterNotice(doc)

    doc.end()
  })
}
