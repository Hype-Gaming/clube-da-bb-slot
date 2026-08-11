<script setup lang="ts">
import { useSlotCatalog } from '~/composables/useSlots'

const route = useRoute()
const { getSlotById } = useSlotCatalog()
const { authorizedFetch } = useAuth()
const slot = computed(() => getSlotById(String(route.params.id)))
const gameUrl = ref('')
const loading = ref(false)
const errorMessage = ref('')

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
    const source = response?.game_url || response?.payload?.gameURL
    if (!isPlayableSource(source)) throw new Error('A operadora não retornou um launcher válido para o jogo.')
    gameUrl.value = source
  } catch (error: any) {
    errorMessage.value = error?.data?.message || error?.message || 'Não foi possível abrir o jogo agora.'
  } finally {
    loading.value = false
  }
}

onMounted(startGame)

function isPlayableSource(source: unknown): source is string {
  if (typeof source !== 'string' || !source.trim()) return false
  if (/^\s*(?:<!doctype\s+html|<html\b)/i.test(source)) return true
  try {
    return ['https:', 'http:', 'data:', 'blob:'].includes(new URL(source).protocol)
  } catch {
    return false
  }
}
</script>

<template>
  <main class="player-page">
    <header class="player-header">
      <NuxtLink to="/" class="player-control" title="Voltar ao catálogo"><Icon name="lucide:arrow-left" /><span class="control-label">Voltar</span></NuxtLink>
      <div class="player-title"><span>{{ slot?.symbol || '!' }}</span><div><strong>{{ slot?.name || 'Jogo indisponível' }}</strong><small>{{ gameUrl ? 'Em jogo' : 'Clube da BB Slots' }}</small></div></div>
      <NuxtLink to="/" class="player-control close" title="Fechar jogo"><span class="control-label">Fechar</span><Icon name="lucide:x" /></NuxtLink>
    </header>
    <section v-if="loading" class="player-status"><span class="loader" /><h1>Preparando seu jogo</h1><p>A conexão segura pode levar alguns segundos.</p></section>
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
