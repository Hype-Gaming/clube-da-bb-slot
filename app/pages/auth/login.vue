<script setup lang="ts">
definePageMeta({ layout: false })
useHead({ title: 'Entrar' })
const route = useRoute()
const { login } = useAuth()
const identifier = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errorMessage = ref(route.query.expired ? 'Sua sessão expirou. Entre novamente.' : '')

async function submit() {
  errorMessage.value = ''
  if (!identifier.value.trim() || !password.value) {
    errorMessage.value = 'Preencha seu e-mail/CPF e sua senha.'
    return
  }
  loading.value = true
  try {
    await login(identifier.value, password.value)
    await navigateTo('/')
  } catch (error: any) {
    errorMessage.value = error?.data?.message || error?.message || 'Não foi possível entrar. Confira seus dados.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="login-page">
    <div class="login-glow glow-one" /><div class="login-glow glow-two" />
    <section class="login-panel">
      <AppLogo />
      <div class="login-heading">
        <p class="eyebrow">Bem-vindo de volta</p>
        <h1>Entre para jogar</h1>
        <p>Acesse seus jogos com sua conta Esportiva.</p>
      </div>
      <form novalidate @submit.prevent="submit">
        <label for="identifier">E-mail ou CPF</label>
        <div class="field-wrap"><Icon name="lucide:user-round" /><input id="identifier" v-model="identifier" type="text" inputmode="email" autocomplete="username" placeholder="Digite seu e-mail ou CPF"></div>
        <label for="password">Senha</label>
        <div class="field-wrap"><Icon name="lucide:lock-keyhole" /><input id="password" v-model="password" :type="showPassword ? 'text' : 'password'" autocomplete="current-password" placeholder="Digite sua senha"><button type="button" :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'" @click="showPassword = !showPassword"><Icon :name="showPassword ? 'lucide:eye-off' : 'lucide:eye'" /></button></div>
        <p v-if="errorMessage" class="form-error" role="alert"><Icon name="lucide:circle-alert" /> {{ errorMessage }}</p>
        <button class="button button-gold button-wide login-submit" type="submit" :disabled="loading">
          <span v-if="loading" class="loader small" />
          <template v-else>Entrar <Icon name="lucide:arrow-right" /></template>
        </button>
      </form>
      <div class="signup-block">
        <p>Não possui uma conta?</p>
        <a class="signup-link" href="https://go.aff.esportiva.bet/imo5e5c7?utm_campaign=app-slots" target="_blank" rel="noopener">
          <Icon name="lucide:circle-plus" /> Criar conta na Esportiva
        </a>
      </div>
      <p class="responsible-note">18+ · Jogue com responsabilidade.</p>
    </section>
  </main>
</template>
