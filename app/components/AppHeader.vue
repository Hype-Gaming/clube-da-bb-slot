<script setup lang="ts">
const emit = defineEmits<{ deposit: [] }>()
const { session, logout } = useAuth()
const menuOpen = ref(false)
const formattedBalance = computed(() => session.value.balance == null
  ? '—'
  : session.value.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }))
const firstName = computed(() => session.value.user?.name?.trim().split(' ')[0] || 'Minha conta')
</script>

<template>
  <header class="app-header">
    <NuxtLink to="/" class="header-brand"><AppLogo /></NuxtLink>
    <div class="header-actions">
      <div class="balance-pill">
        <span>Saldo</span>
        <strong>{{ formattedBalance }}</strong>
      </div>
      <button class="button button-gold deposit-button" type="button" @click="emit('deposit')">
        <Icon name="lucide:wallet-cards" /> <span class="control-label">Depositar</span>
      </button>
      <div class="account-menu">
        <button class="avatar-button" type="button" :aria-expanded="menuOpen" aria-label="Abrir menu da conta" @click="menuOpen = !menuOpen">
          <Icon name="lucide:user-round" />
        </button>
        <div v-if="menuOpen" class="account-popover">
          <span>Olá, {{ firstName }}</span>
          <button type="button" @click="logout()"><Icon name="lucide:log-out" /> Sair</button>
        </div>
      </div>
    </div>
  </header>
</template>
