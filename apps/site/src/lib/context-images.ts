/**
 * Configuração de imagens contextuais por seção do site Hábilis.
 *
 * Cada chave abaixo corresponde a uma "cena" do site. Para cada cena há:
 *  - left:  caminho da imagem que aparece na borda esquerda (ambientação);
 *  - right: caminho da imagem que aparece na borda direita;
 *  - mood:  tom institucional usado pelo fallback gradiente quando não houver
 *           imagem física disponível em /images/contextos/<secao>/.
 *
 * Imagens reais (PNG/JPG) podem ser colocadas em:
 *   apps/site/public/images/contextos/<secao>/
 * O componente <ContextualSideImages> renderiza com fade suave; se a imagem
 * configurada não existir, o fallback gradiente cobre a borda sem quebrar o
 * layout.
 *
 * Importante: este arquivo NÃO toca rotas, autenticação ou regras de negócio.
 */
export type ContextMood = 'verde' | 'laranja' | 'territorio' | 'campo' | 'institucional'

export type ContextScene = {
  left?: string
  right?: string
  mood: ContextMood
  alt?: string
}

const HABILIS = {
  hero: '/images/habilis/hero-inteligencia-regulatoria-multissetorial.png',
  sistemaDashboard: '/images/habilis/sistema-habilis-dashboard-regulatorio.png',
  postos: '/images/habilis/servico-postos-combustiveis-operacoes-reguladas.png',
  industrial: '/images/habilis/servico-industrial-licenciamento-condicionantes.png',
  mineracao: '/images/habilis/servico-mineracao-licenciamento-campo.png',
  rural: '/images/habilis/servico-rural-car-leitura-territorial.png',
  urbano: '/images/habilis/servico-urbano-regularizacao-territorial.png',
  patrimonio: '/images/habilis/servico-arqueologia-patrimonio-cultural.png',
  espeleologia: '/images/habilis/servico-espeleologia-cavidades.png',
  condicionantes: '/images/habilis/servico-gestao-condicionantes-conformidade.png',
} as const

export const CONTEXT_SCENES = {
  home: {
    left: HABILIS.postos,
    right: HABILIS.rural,
    mood: 'institucional',
    alt: 'Ambientação Hábilis: posto de combustíveis, território rural e monitoramento ambiental.',
  },
  'portal-cliente': {
    left: HABILIS.condicionantes,
    right: HABILIS.industrial,
    mood: 'laranja',
    alt: 'Portal do cliente: envio de documentos, comunicação e transparência.',
  },
  campo: {
    left: HABILIS.mineracao,
    right: HABILIS.postos,
    mood: 'campo',
    alt: 'Área de campo: vistoria técnica, coleta de evidências e registro fotográfico.',
  },
  equipe: {
    left: HABILIS.industrial,
    right: HABILIS.condicionantes,
    mood: 'laranja',
    alt: 'Acesso da equipe técnica: validação documental e operação integrada.',
  },
  'sistema-interno': {
    left: HABILIS.sistemaDashboard,
    right: HABILIS.condicionantes,
    mood: 'institucional',
    alt: 'Sistema interno: dashboard, licenças, condicionantes e prazos.',
  },
  territorio: {
    left: HABILIS.rural,
    right: HABILIS.espeleologia,
    mood: 'territorio',
    alt: 'Inteligência territorial: mapas, hidrografia e leitura espacial.',
  },
  servicos: {
    left: HABILIS.industrial,
    right: HABILIS.condicionantes,
    mood: 'institucional',
    alt: 'Serviços: licenciamento, compliance ambiental e gestão documental.',
  },
  projetos: {
    left: HABILIS.mineracao,
    right: HABILIS.urbano,
    mood: 'territorio',
    alt: 'Projetos: empreendimentos, relatórios e entregáveis técnicos.',
  },
  sobre: {
    left: HABILIS.hero,
    right: HABILIS.patrimonio,
    mood: 'institucional',
    alt: 'Sobre a Hábilis: equipe, consultoria e atuação técnica.',
  },
  contato: {
    left: HABILIS.condicionantes,
    right: HABILIS.hero,
    mood: 'verde',
    alt: 'Contato Hábilis: atendimento, suporte e orientação técnica.',
  },
  clientes: {
    left: HABILIS.postos,
    right: HABILIS.industrial,
    mood: 'institucional',
    alt: 'Clientes Hábilis: operações que confiam a frente regulatória.',
  },
  noticias: {
    left: HABILIS.condicionantes,
    right: HABILIS.patrimonio,
    mood: 'institucional',
    alt: 'Notícias e informativos técnico-operacionais.',
  },
  'trabalhe-conosco': {
    left: HABILIS.industrial,
    right: HABILIS.rural,
    mood: 'verde',
    alt: 'Trabalhe conosco: time multidisciplinar Hábilis.',
  },
  'canal-de-denuncias': {
    left: HABILIS.condicionantes,
    right: HABILIS.industrial,
    mood: 'institucional',
    alt: 'Canal de denúncias: ambiente seguro e confidencial.',
  },
  sistema: {
    left: HABILIS.sistemaDashboard,
    right: HABILIS.condicionantes,
    mood: 'institucional',
    alt: 'Sistema Hábilis: quatro interfaces, uma operação.',
  },
} satisfies Record<string, ContextScene>

export type ContextSceneKey = keyof typeof CONTEXT_SCENES

export function getScene(key: ContextSceneKey): ContextScene {
  return CONTEXT_SCENES[key]
}

const MOOD_GRADIENT: Record<ContextMood, string> = {
  verde:
    'radial-gradient(60% 60% at 30% 40%, rgba(0,158,60,0.18), transparent 70%), linear-gradient(180deg, rgba(255,255,255,0.55), rgba(247,244,236,0.95))',
  laranja:
    'radial-gradient(60% 60% at 70% 35%, rgba(243,146,0,0.20), transparent 70%), linear-gradient(180deg, rgba(255,255,255,0.55), rgba(247,244,236,0.95))',
  territorio:
    'radial-gradient(60% 50% at 40% 30%, rgba(0,158,60,0.16), transparent 65%), radial-gradient(50% 50% at 70% 70%, rgba(120,86,40,0.10), transparent 65%), linear-gradient(180deg, rgba(255,255,255,0.55), rgba(247,244,236,0.95))',
  campo:
    'radial-gradient(60% 60% at 30% 60%, rgba(120,86,40,0.16), transparent 70%), radial-gradient(50% 50% at 70% 30%, rgba(243,146,0,0.14), transparent 65%), linear-gradient(180deg, rgba(255,255,255,0.55), rgba(247,244,236,0.95))',
  institucional:
    'radial-gradient(50% 50% at 20% 30%, rgba(243,146,0,0.14), transparent 65%), radial-gradient(50% 50% at 80% 70%, rgba(0,158,60,0.14), transparent 65%), linear-gradient(180deg, rgba(255,255,255,0.55), rgba(247,244,236,0.95))',
}

export function moodFallback(mood: ContextMood): string {
  return MOOD_GRADIENT[mood]
}
