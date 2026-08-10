<script setup lang="ts">
defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()
const config = useRuntimeConfig()
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="modal-backdrop" role="presentation" @click.self="emit('close')">
      <section class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="deposit-title">
        <button class="modal-close" type="button" aria-label="Fechar" @click="emit('close')"><Icon name="lucide:x" /></button>
        <span class="modal-icon"><Icon name="lucide:wallet-cards" /></span>
        <p class="eyebrow">Sua conta Esportiva</p>
        <h2 id="deposit-title">Adicionar saldo</h2>
        <p>O depósito é concluído com segurança no ambiente da Esportiva. Seu saldo atualizado aparecerá aqui ao voltar.</p>
        <a v-if="config.public.depositUrl" class="button button-gold button-wide" :href="config.public.depositUrl" target="_blank" rel="noopener">Ir para depósito <Icon name="lucide:external-link" /></a>
        <p v-else class="notice"><Icon name="lucide:info" /> Link de depósito ainda não configurado.</p>
      </section>
    </div>
  </Teleport>
</template>
