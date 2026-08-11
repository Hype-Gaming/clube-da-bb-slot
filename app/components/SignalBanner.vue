<script setup lang="ts">
const SIGNAL_TEMPLATE = 'Alterne {2-8}× entre rápido e turbo; comece no {rápido,turbo}'
const BASE_DURATION_SECONDS = 80
const WAITING_SECONDS = 3

const message = ref('Preparando entrada...')
const remaining = ref(0)
const total = ref(BASE_DURATION_SECONDS)
const waiting = ref(false)
let interval: ReturnType<typeof setInterval> | undefined
let phaseEndsAt = 0

const formattedTime = computed(() => {
  const minutes = Math.floor(remaining.value / 60)
  const seconds = remaining.value % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

const progress = computed(() => {
  if (!total.value) return 0
  return Math.max(0, Math.min(100, (remaining.value / total.value) * 100))
})

onMounted(() => {
  startCycle()
  interval = setInterval(tick, 250)
})

onBeforeUnmount(() => {
  if (interval) clearInterval(interval)
})

function startCycle() {
  waiting.value = false
  message.value = renderSignalTemplate(SIGNAL_TEMPLATE)
  total.value = randomInteger(
    Math.round(BASE_DURATION_SECONDS * 0.7),
    Math.round(BASE_DURATION_SECONDS * 1.3)
  )
  remaining.value = total.value
  phaseEndsAt = Date.now() + total.value * 1000
}

function startWaiting() {
  waiting.value = true
  message.value = 'Aguardando...'
  total.value = WAITING_SECONDS
  remaining.value = WAITING_SECONDS
  phaseEndsAt = Date.now() + WAITING_SECONDS * 1000
}

function tick() {
  remaining.value = Math.max(0, Math.ceil((phaseEndsAt - Date.now()) / 1000))
  if (remaining.value > 0) return
  if (waiting.value) startCycle()
  else startWaiting()
}

function renderSignalTemplate(template: string) {
  return template.replace(/\{([^{}]*)\}/g, (literal, content: string) => {
    if (/^\d+-\d+$/.test(content)) {
      const [min, max] = content.split('-').map(Number)
      if (min != null && max != null && min <= max) return String(randomInteger(min, max))
      return literal
    }

    if (content.includes(',')) {
      const options = content.split(',')
      if (options.every(option => option.length > 0)) {
        return options[randomInteger(0, options.length - 1)] ?? literal
      }
    }

    return literal
  })
}

function randomInteger(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
</script>

<template>
  <div class="signal-wrap" role="status" aria-live="polite">
    <div class="signal-pill" :class="{ waiting }">
      <span class="signal-dot" />
      <span class="signal-label">{{ waiting ? 'Status:' : 'Entrada:' }}</span>
      <strong>{{ message }}</strong>
      <time :datetime="`PT${remaining}S`">{{ formattedTime }}</time>
    </div>
    <div class="signal-progress-track" aria-hidden="true">
      <span :style="{ width: `${progress}%` }" />
    </div>
  </div>
</template>
