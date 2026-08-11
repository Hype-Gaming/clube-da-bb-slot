<script setup lang="ts">
import type { SlotDefinition } from '~/constants/slots'
import { useSlotCatalog } from '~/composables/useSlots'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()
const { slots } = useSlotCatalog()
const selectedSlot = ref<SlotDefinition | null>(null)
const drawing = ref(false)

const eligibleSlots = computed(() => slots.filter(slot => slot.enabled && slot.slug))

watch(() => props.open, (open) => {
  if (open) selectedSlot.value = null
})

function drawGame() {
  if (!eligibleSlots.value.length || drawing.value) return
  drawing.value = true
  window.setTimeout(() => {
    const index = Math.floor(Math.random() * eligibleSlots.value.length)
    selectedSlot.value = eligibleSlots.value[index] || null
    drawing.value = false
  }, 700)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="modal-backdrop" role="presentation" @click.self="emit('close')">
      <section class="modal-panel promotion-modal" role="dialog" aria-modal="true" aria-labelledby="promotion-title">
        <button class="modal-close" type="button" aria-label="Fechar promoção" @click="emit('close')"><Icon name="lucide:x" /></button>

        <template v-if="!selectedSlot">
          <span class="modal-icon promotion-icon"><Icon name="lucide:sparkles" /></span>
          <p class="eyebrow">Ação especial</p>
          <h2 id="promotion-title">Seu próximo jogo pode estar a um clique</h2>
          <p>Confirme sua participação para sortear um slot e faça uma aposta de R$ 1 diretamente no jogo escolhido.</p>
          <div class="promotion-bet-card">
            <span>Valor da participação</span>
            <strong>R$ 1,00</strong>
            <small>A aposta é realizada no ambiente da Esportiva.</small>
          </div>
          <button class="button button-gold button-wide" type="button" :disabled="drawing || !eligibleSlots.length" @click="drawGame">
            <span v-if="drawing" class="loader small" />
            <template v-else>Confirmar e sortear jogo <Icon name="lucide:dices" /></template>
          </button>
        </template>

        <template v-else>
          <p class="eyebrow">Jogo selecionado</p>
          <div class="promotion-result-art">
            <img :src="selectedSlot.image" :alt="`Imagem de ${selectedSlot.name}`">
          </div>
          <h2 id="promotion-title">{{ selectedSlot.name }}</h2>
          <p>Sua participação foi confirmada. Abra o jogo e faça uma aposta de R$ 1 para participar da ação.</p>
          <NuxtLink class="button button-gold button-wide" :to="`/slot/${selectedSlot.id}`" @click="emit('close')">
            Jogar agora <Icon name="lucide:play" />
          </NuxtLink>
          <button class="promotion-redraw" type="button" @click="selectedSlot = null">Sortear outro jogo</button>
        </template>

        <p class="promotion-disclaimer">18+ · A aposta e qualquer benefício promocional são processados pela operadora.</p>
      </section>
    </div>
  </Teleport>
</template>
