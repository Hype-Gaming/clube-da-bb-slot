<script setup lang="ts">
const props = defineProps<{ url: string; title: string }>()
const frame = ref<HTMLIFrameElement | null>(null)
const wrapper = ref<HTMLElement | null>(null)
const frameKey = ref(0)
const loaded = ref(false)
const isHtmlDocument = computed(() => /^\s*(?:<!doctype\s+html|<html\b)/i.test(props.url))
const frameSrc = computed(() => isHtmlDocument.value ? undefined : props.url)
const frameSrcdoc = computed(() => isHtmlDocument.value ? props.url : undefined)
// O documento HTML de alguns provedores (PG Soft) e so um seletor de espelho: ele
// mede a latencia de varios dominios e faz location.replace para o jogo. O sandbox
// sobrevive a essa navegacao, entao sem allow-same-origin o jogo carrega em origem
// opaca — sem localStorage, sem cookies e com Origin: null no WebSocket — e o
// provedor recusa a sessao (G1002).
// Com allow-scripts junto, o allow-same-origin torna o sandbox burlavel pelo proprio
// frame; ele fica aqui pelo que ainda barra, como navegar a janela de topo.
const frameSandbox = computed(() => isHtmlDocument.value
  ? 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-pointer-lock allow-orientation-lock'
  : undefined)

function reload() {
  loaded.value = false
  frameKey.value++
}

async function fullscreen() {
  await wrapper.value?.requestFullscreen?.()
}
</script>

<template>
  <section ref="wrapper" class="game-frame-wrap">
    <div v-if="!loaded" class="frame-loading"><span class="loader" /><p>Carregando {{ title }}…</p></div>
    <iframe
      :key="frameKey"
      ref="frame"
      :src="frameSrc"
      :srcdoc="frameSrcdoc"
      :sandbox="frameSandbox"
      :title="title"
      allow="autoplay; fullscreen"
      allowfullscreen
      @load="loaded = true"
    />
    <div class="frame-tools">
      <button type="button" title="Recarregar jogo" aria-label="Recarregar jogo" @click="reload"><Icon name="lucide:rotate-cw" /></button>
      <button type="button" title="Tela cheia" aria-label="Abrir em tela cheia" @click="fullscreen"><Icon name="lucide:maximize" /></button>
    </div>
  </section>
</template>
