<script setup lang="ts">
const props = defineProps<{ url: string; title: string }>()
const frame = ref<HTMLIFrameElement | null>(null)
const wrapper = ref<HTMLElement | null>(null)
const frameKey = ref(0)
const loaded = ref(false)

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
      :src="props.url"
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
