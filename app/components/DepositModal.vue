<script setup lang="ts">
const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()
const { state, reset, createDeposit, checkPayment, copyPixCode } = useDeposit()
const inputAmount = ref<number | null>(null)
const copied = ref(false)
const quickValues = [10, 20, 50, 100, 200, 500]

watch(() => props.open, (open) => {
  if (!open) return
  reset()
  inputAmount.value = null
  copied.value = false
})

async function submit() {
  await createDeposit(Number(inputAmount.value))
}

async function copy() {
  copied.value = await copyPixCode()
  if (copied.value) setTimeout(() => { copied.value = false }, 2000)
}

function close() {
  emit('close')
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="modal-backdrop" role="presentation" @click.self="close">
      <section class="modal-panel deposit-modal" role="dialog" aria-modal="true" aria-labelledby="deposit-title">
        <button class="modal-close" type="button" aria-label="Fechar" @click="close"><Icon name="lucide:x" /></button>

        <template v-if="state.step === 'amount'">
          <span class="modal-icon"><Icon name="lucide:qr-code" /></span>
          <p class="eyebrow">Depósito via PIX</p>
          <h2 id="deposit-title">Adicionar saldo</h2>
          <p>Escolha um valor para gerar o código PIX.</p>
          <form class="deposit-form" @submit.prevent="submit">
            <label for="deposit-amount">Valor do depósito</label>
            <div class="deposit-amount-field">
              <span>R$</span>
              <input id="deposit-amount" v-model.number="inputAmount" type="number" inputmode="decimal" min="1" step="0.01" placeholder="0,00" required>
            </div>
            <div class="quick-values" aria-label="Valores sugeridos">
              <button v-for="value in quickValues" :key="value" type="button" @click="inputAmount = value">R$ {{ value }}</button>
            </div>
            <p v-if="state.error" class="deposit-error" role="alert"><Icon name="lucide:circle-alert" /> {{ state.error }}</p>
            <button class="button button-gold button-wide" type="submit" :disabled="state.loading || !inputAmount || inputAmount < 1">
              <span v-if="state.loading" class="loader small" />
              <template v-else>Gerar PIX <Icon name="lucide:qr-code" /></template>
            </button>
          </form>
        </template>

        <template v-else-if="state.step === 'payment'">
          <span class="modal-icon"><Icon name="lucide:scan-line" /></span>
          <p class="eyebrow">PIX gerado</p>
          <h2 id="deposit-title">{{ formatCurrency(state.amount) }}</h2>
          <p>Escaneie o QR Code ou use o código copia e cola no aplicativo do seu banco.</p>
          <img v-if="state.data?.qr_code" class="deposit-qr" :src="state.data.qr_code" alt="QR Code do depósito PIX">
          <label class="pix-code-label" for="pix-code">Código PIX copia e cola</label>
          <div class="pix-code-row">
            <input id="pix-code" :value="state.data?.br_code" readonly @focus="($event.target as HTMLInputElement).select()">
            <button type="button" @click="copy"><Icon :name="copied ? 'lucide:check' : 'lucide:copy'" /> {{ copied ? 'Copiado' : 'Copiar' }}</button>
          </div>
          <p v-if="state.statusMessage" class="deposit-notice" role="status">{{ state.statusMessage }}</p>
          <p v-if="state.error" class="deposit-error" role="alert"><Icon name="lucide:circle-alert" /> {{ state.error }}</p>
          <button class="button button-gold button-wide" type="button" :disabled="state.loading" @click="checkPayment">
            <span v-if="state.loading" class="loader small" />
            <template v-else>Já paguei, verificar <Icon name="lucide:refresh-cw" /></template>
          </button>
        </template>

        <template v-else>
          <span class="modal-icon success"><Icon name="lucide:circle-check" /></span>
          <p class="eyebrow">Pagamento identificado</p>
          <h2 id="deposit-title">Saldo atualizado</h2>
          <p>O pagamento foi confirmado e consultamos novamente o saldo da sua conta.</p>
          <button class="button button-gold button-wide" type="button" @click="close">Concluir</button>
        </template>
      </section>
    </div>
  </Teleport>
</template>
