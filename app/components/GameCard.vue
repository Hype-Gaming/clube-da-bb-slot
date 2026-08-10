<script setup lang="ts">
import type { SlotDefinition } from '~/constants/slots'
defineProps<{ slot: SlotDefinition }>()
</script>

<template>
  <article class="game-card" :class="{ disabled: !slot.enabled }">
    <div class="card-art" :style="{ '--c1': slot.palette[0], '--c2': slot.palette[1] }">
      <img v-if="slot.image" :src="slot.image" :alt="`Imagem de ${slot.name}`">
      <div v-else class="placeholder-art" role="img" :aria-label="`Placeholder de ${slot.name}`">
        <span>{{ slot.symbol }}</span>
        <small>{{ slot.name }}</small>
      </div>
      <span class="asset-label">{{ slot.image ? 'Imagem do jogo' : 'Asset pendente' }}</span>
      <span v-if="!slot.enabled" class="soon-badge">Em breve</span>
      <NuxtLink v-if="slot.enabled" :to="`/slot/${slot.id}`" class="play-overlay" :aria-label="`Jogar ${slot.name}`">
        <span><Icon name="lucide:play" /></span>
      </NuxtLink>
    </div>
    <div class="card-body">
      <div>
        <h3>{{ slot.name }}</h3>
        <p v-if="slot.provider">{{ slot.provider }}</p>
        <p v-else>{{ slot.enabled ? 'Disponível agora' : 'Aguardando confirmação' }}</p>
      </div>
      <NuxtLink v-if="slot.enabled" :to="`/slot/${slot.id}`" class="card-arrow" :aria-label="`Abrir ${slot.name}`">
        <Icon name="lucide:arrow-up-right" />
      </NuxtLink>
      <Icon v-else name="lucide:lock-keyhole" class="locked-icon" />
    </div>
  </article>
</template>
