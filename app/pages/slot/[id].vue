<script setup lang="ts">
import { useSlotCatalog } from '~/composables/useSlots'

const route = useRoute()
const { getSlotById } = useSlotCatalog()
const { authorizedFetch } = useAuth()
const slot = computed(() => getSlotById(String(route.params.id)))
const gameUrl = ref('')
const loading = ref(false)
const errorMessage = ref('')

// DIAGNOSTICO TEMPORARIO (?debug=1): busca a URL de launch e a exibe sem montar o
// iframe, para que o token de uso unico chegue intacto ao teste em aba de topo.
// Remover junto com a secao .debug-panel do template quando o G1002 for resolvido.
const debugMode = computed(() => route.query.debug === '1')
const debugResponse = ref<any>(null)
const launchSource = computed(() => String(debugResponse.value?.game_url || debugResponse.value?.payload?.gameURL || ''))
const launchIsHtml = computed(() => /^\s*(?:<!doctype\s+html|<html\b)/i.test(launchSource.value))
const launchAssets = computed(() => launchIsHtml.value
  ? [...launchSource.value.matchAll(/(?:src|href)="([^"]+)"/gi)].map(m => m[1]).slice(0, 25)
  : [])
// Se o HTML carregar dentro de si a URL real do launcher (iframe/form/redirect), da
// para usar o mesmo caminho do Good Game (<iframe src>) em vez do srcdoc.
const launchEmbeddedUrls = computed(() => launchIsHtml.value
  ? [...new Set([...launchSource.value.matchAll(/https?:\/\/[^\s"'<>\\]+/gi)].map(m => m[0]))].slice(0, 25)
  : [])
const launchCarriers = computed(() => {
  const html = launchSource.value
  return {
    'iframe interno': (html.match(/<iframe[^>]*src="([^"]+)"/i) || [])[1] || '—',
    'form action': (html.match(/<form[^>]*action="([^"]+)"/i) || [])[1] || '—',
    'meta refresh': (html.match(/http-equiv="refresh"[^>]*content="([^"]+)"/i) || [])[1] || '—',
    'location assign': (html.match(/location(?:\.href)?\s*=\s*["']([^"']+)["']/i) || [])[1] || '—'
  }
})
const launchResolved = computed(() => launchIsHtml.value
  ? (extractLauncherUrl(launchSource.value) || '(nenhuma encontrada — caiu no srcdoc)')
  : '(a resposta já era uma URL)')
const launchSignals = computed(() => {
  const html = launchSource.value
  return {
    tamanho: html.length,
    'le location.search': /location\.search/.test(html),
    'le location.href': /location\.href/.test(html),
    'usa localStorage': /localStorage/.test(html),
    'usa postMessage': /postMessage/.test(html),
    'abre WebSocket': /WebSocket|wss:/.test(html),
    'tem token inline': /(token|ot=|ops|sessionId|session_id)/i.test(html)
  }
})

// Salva a resposta crua em disco para inspecao: o token fica na maquina do usuario
// em vez de trafegar por chat.
function downloadResponse() {
  const blob = new Blob([JSON.stringify(debugResponse.value, null, 2)], { type: 'application/json' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `launcher-${String(route.params.id)}.json`
  link.click()
  URL.revokeObjectURL(link.href)
}

useHead(() => ({ title: slot.value?.name || 'Jogo indisponível' }))

function platform(): 'WEB' | 'MOBILE' {
  if (!import.meta.client) return 'WEB'
  return matchMedia('(max-width: 767px), (pointer: coarse)').matches ? 'MOBILE' : 'WEB'
}

async function startGame() {
  gameUrl.value = ''
  errorMessage.value = ''
  if (!slot.value?.enabled || !slot.value.slug) {
    errorMessage.value = 'Este jogo ainda não foi liberado pela Esportiva.'
    return
  }
  loading.value = true
  try {
    const response = await authorizedFetch<any>('/api/start-game', {
      method: 'GET',
      query: { slug: slot.value.slug, platform: platform(), use_demo: 0 }
    })
    debugResponse.value = response
    const source = response?.game_url || response?.payload?.gameURL
    if (!isPlayableSource(source)) throw new Error('A operadora não retornou um launcher válido para o jogo.')
    gameUrl.value = resolveLauncher(source)
  } catch (error: any) {
    errorMessage.value = error?.data?.message || error?.message || 'Não foi possível abrir o jogo agora.'
  } finally {
    loading.value = false
  }
}

onMounted(startGame)

function looksLikeHtml(source: string) {
  return /^\s*(?:<!doctype\s+html|<html\b)/i.test(source)
}

function isPlayableSource(source: unknown): source is string {
  if (typeof source !== 'string' || !source.trim()) return false
  if (looksLikeHtml(source)) return true
  try {
    return ['https:', 'http:', 'data:', 'blob:'].includes(new URL(source).protocol)
  } catch {
    return false
  }
}

function isAbsoluteHttpUrl(value: string) {
  try {
    return ['https:', 'http:'].includes(new URL(value).protocol)
  } catch {
    return false
  }
}

// Atributos HTML escapam o separador de query, e o launcher nao sobrevive a perder
// os parametros depois do primeiro `&`.
function decodeAttribute(value: string) {
  return value.trim().replace(/&amp;/gi, '&').replace(/&#0*38;/g, '&')
}

// A resposta do /api/start-game varia por provedor: a maioria devolve a URL do
// launcher, mas a PG Soft devolve o documento HTML ja montado. Esse HTML so poderia
// ir para um `srcdoc`, que roda em origem opaca e sem query string — o launcher nao
// consegue validar a sessao e responde G1002. Quando o documento carrega a URL real
// dentro de si, extrair essa URL faz a PG Soft cair no mesmo `<iframe src>` que ja
// funciona para os outros provedores.
function extractLauncherUrl(html: string) {
  const carriers = [
    /<iframe[^>]*\bsrc=["']([^"']+)["']/i,
    /<frame[^>]*\bsrc=["']([^"']+)["']/i,
    /<form[^>]*\baction=["']([^"']+)["']/i,
    /http-equiv=["']refresh["'][^>]*content=["'][^"']*?url=([^"';]+)/i,
    /(?:window\.)?location\.replace\(\s*["']([^"']+)["']\s*\)/i,
    /(?:window\.)?location(?:\.href)?\s*=\s*["']([^"']+)["']/i
  ]
  for (const carrier of carriers) {
    const candidate = decodeAttribute(html.match(carrier)?.[1] || '')
    if (candidate && isAbsoluteHttpUrl(candidate)) return candidate
  }
  return ''
}

function resolveLauncher(source: string) {
  if (!looksLikeHtml(source)) return source
  // Sem URL embutida o documento e tudo que temos; o srcdoc ao menos renderiza a
  // tela do provedor em vez de deixar o jogador sem retorno nenhum.
  return extractLauncherUrl(source) || source
}
</script>

<template>
  <main class="player-page">
    <header class="player-header">
      <div class="player-left">
        <NuxtLink to="/" class="player-control" title="Voltar ao catálogo"><Icon name="lucide:arrow-left" /><span class="control-label">Voltar</span></NuxtLink>
        <div class="player-title"><span>{{ slot?.symbol || '!' }}</span><div><strong>{{ slot?.name || 'Jogo indisponível' }}</strong><small>{{ gameUrl ? 'Em jogo' : 'Clube da BB Slots' }}</small></div></div>
      </div>
      <SignalBanner v-if="slot?.enabled" />
      <NuxtLink to="/" class="player-control close" title="Fechar jogo"><span class="control-label">Fechar</span><Icon name="lucide:x" /></NuxtLink>
    </header>
    <section v-if="loading" class="player-status"><span class="loader" /><h1>Preparando seu jogo</h1><p>A conexão segura pode levar alguns segundos.</p></section>
    <section v-else-if="debugMode && (debugResponse || errorMessage)" class="debug-panel">
      <h1>Diagnóstico do launcher</h1>
      <p>O iframe não foi montado — o token abaixo está intacto. Abra o link numa aba nova.</p>
      <p v-if="errorMessage" class="debug-error">{{ errorMessage }}</p>
      <p><strong>Formato do launcher:</strong> {{ launchIsHtml ? 'documento HTML (não é URL)' : 'URL' }}</p>
      <p><strong>URL extraída:</strong></p>
      <pre>{{ launchResolved }}</pre>
      <a v-if="launchSource && !launchIsHtml" :href="launchSource" target="_blank" rel="noopener" class="button button-gold">Abrir launcher em aba de topo</a>
      <template v-if="launchIsHtml">
        <p><strong>Sinais no HTML:</strong></p>
        <pre>{{ JSON.stringify(launchSignals, null, 2) }}</pre>
        <p><strong>Onde a URL real pode estar:</strong></p>
        <pre>{{ JSON.stringify(launchCarriers, null, 2) }}</pre>
        <p><strong>URLs absolutas no HTML ({{ launchEmbeddedUrls.length }}):</strong></p>
        <pre>{{ launchEmbeddedUrls.join('\n') || '(nenhuma — os assets são relativos)' }}</pre>
        <p><strong>Assets referenciados ({{ launchAssets.length }}):</strong></p>
        <pre>{{ launchAssets.join('\n') }}</pre>
      </template>
      <p><strong>Campos da resposta:</strong> {{ Object.keys(debugResponse || {}).join(', ') }}</p>
      <button class="button button-gold" type="button" @click="downloadResponse">Baixar resposta completa (.json)</button>
      <button class="button button-ghost" type="button" @click="startGame">Gerar novo token</button>
    </section>
    <GamePlayer v-else-if="gameUrl && slot" :url="gameUrl" :title="slot.name" />
    <section v-else class="player-status error-state">
      <span class="status-icon"><Icon :name="slot ? 'lucide:triangle-alert' : 'lucide:circle-off'" /></span>
      <p class="eyebrow">{{ slot ? 'Não foi possível iniciar' : 'Código inválido' }}</p>
      <h1>{{ slot ? 'Jogo indisponível' : 'Jogo não encontrado' }}</h1>
      <p>{{ errorMessage || 'O jogo solicitado não existe no nosso catálogo.' }}</p>
      <div class="status-actions"><button v-if="slot?.enabled" class="button button-gold" type="button" @click="startGame"><Icon name="lucide:rotate-cw" /> Tentar novamente</button><NuxtLink to="/" class="button button-ghost">Voltar ao catálogo</NuxtLink></div>
    </section>
  </main>
</template>

<!-- DIAGNOSTICO TEMPORARIO: remover junto com a secao .debug-panel. -->
<style scoped>
.debug-panel { display: grid; gap: 12px; justify-items: start; padding: 24px; overflow-y: auto; }
.debug-panel pre { width: 100%; max-height: 40vh; overflow: auto; background: #00000066; padding: 12px; border-radius: 8px; font-size: 12px; }
.debug-error { color: #ff6b6b; }
</style>
