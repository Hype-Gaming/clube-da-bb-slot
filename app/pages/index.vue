<script setup lang="ts">
import { useSlotCatalog } from '~/composables/useSlots'

useHead({ title: 'Jogos' })
const { query, filteredSlots, slots } = useSlotCatalog()
const { session, refreshAccount } = useAuth()
const route = useRoute()
const router = useRouter()
const depositOpen = ref(false)
const promotionOpen = ref(false)
const featured = slots.find(slot => slot.featured)

function updateAccount() {
  refreshAccount().catch((error) => console.warn('Não foi possível atualizar o saldo.', error))
}

onMounted(() => {
  updateAccount()
  window.addEventListener('focus', updateAccount)
  if (route.query.promotion === '1') {
    promotionOpen.value = true
    router.replace({ path: '/' })
  }
})
onBeforeUnmount(() => window.removeEventListener('focus', updateAccount))
</script>

<template>
  <div class="site-shell">
    <AppHeader @deposit="depositOpen = true" />
    <main class="home-content">
      <section v-if="featured" class="hero">
        <img :src="featured.heroImage || featured.image" alt="Arte ilustrativa original de um tigre dourado">
        <div class="hero-shade" />
        <div class="hero-copy">
          <p class="eyebrow"><span /> Destaque da semana</p>
          <h1>A sorte chama.<br><em>Você atende?</em></h1>
          <p>Entre no universo de {{ featured.name }} e aproveite uma experiência imersiva.</p>
          <NuxtLink :to="`/slot/${featured.id}`" class="button button-gold"><Icon name="lucide:play" /> Jogar agora</NuxtLink>
        </div>
        <small>Arte original ilustrativa</small>
      </section>

      <section class="catalog-section">
        <div class="catalog-heading">
          <div><p class="eyebrow">Explore</p><h2>Todos os jogos</h2></div>
          <label class="search-box"><span class="sr-only">Buscar jogo</span><Icon name="lucide:search" /><input v-model="query" type="search" placeholder="Buscar jogo…"><button v-if="query" type="button" aria-label="Limpar busca" @click="query = ''"><Icon name="lucide:x" /></button></label>
        </div>
        <div v-if="filteredSlots.length" class="games-grid">
          <GameCard v-for="slot in filteredSlots" :key="slot.id" :slot="slot" />
        </div>
        <div v-else class="empty-state"><Icon name="lucide:search-x" /><h3>Nenhum jogo encontrado</h3><p>Tente buscar por outro nome.</p><button type="button" class="text-button" @click="query = ''">Limpar busca</button></div>
      </section>
    </main>
    <footer><span>Clube da BB Slots</span><p>Jogue com responsabilidade. Proibido para menores de 18 anos.</p><span>{{ session.user?.name ? `Conta de ${session.user.name.split(' ')[0]}` : 'Esportiva' }}</span></footer>
    <DepositModal :open="depositOpen" @close="depositOpen = false" />
    <PromotionModal :open="promotionOpen" @close="promotionOpen = false" />
  </div>
</template>
