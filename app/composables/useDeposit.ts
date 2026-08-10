export interface DepositResponse {
  success: boolean
  transaction_id: string
  payment_link?: string
  qr_code?: string
  br_code: string
  value?: number
  amount: number
  amount_cents?: number
  user_id?: string | number
}

type DepositStep = 'amount' | 'payment' | 'success'

interface DepositState {
  step: DepositStep
  amount: number
  data: DepositResponse | null
  loading: boolean
  error: string
  statusMessage: string
}

const emptyDeposit = (): DepositState => ({
  step: 'amount',
  amount: 0,
  data: null,
  loading: false,
  error: '',
  statusMessage: ''
})

export const useDeposit = () => {
  const state = useState<DepositState>('esportiva-slots-deposit', emptyDeposit)
  const { authorizedFetch, refreshAccount } = useAuth()

  function reset() {
    state.value = emptyDeposit()
  }

  async function createDeposit(amount: number) {
    if (!Number.isFinite(amount) || amount < 1) {
      state.value.error = 'O valor mínimo para depósito é R$ 1,00.'
      return false
    }

    state.value.loading = true
    state.value.error = ''
    state.value.statusMessage = ''
    try {
      const response = await authorizedFetch<DepositResponse>('/api/deposit', {
        method: 'POST',
        body: { amount }
      })
      if (!response?.success || !response.transaction_id || !response.br_code) {
        throw new Error('A operadora não retornou os dados completos do PIX.')
      }
      state.value.data = response
      state.value.amount = response.amount ?? amount
      state.value.step = 'payment'
      return true
    } catch (error: any) {
      state.value.error = apiErrorMessage(error, 'Não foi possível gerar o PIX. Tente novamente.')
      return false
    } finally {
      state.value.loading = false
    }
  }

  async function checkPayment() {
    const transactionId = state.value.data?.transaction_id
    if (!transactionId) return false

    state.value.loading = true
    state.value.error = ''
    state.value.statusMessage = ''
    try {
      const response = await authorizedFetch<any>(`/api/deposit/${encodeURIComponent(transactionId)}/status`, {
        method: 'GET',
        query: { transaction_id: transactionId }
      })
      const status = String(response?.status || response?.data?.status || '').toLowerCase()
      if (['completed', 'complete', 'paid', 'approved', 'success'].includes(status)) {
        await refreshAccount()
        state.value.step = 'success'
        return true
      }
      state.value.statusMessage = 'Pagamento ainda não identificado. Aguarde alguns segundos e tente novamente.'
      return false
    } catch (error: any) {
      state.value.error = apiErrorMessage(error, 'Não foi possível consultar o pagamento agora.')
      return false
    } finally {
      state.value.loading = false
    }
  }

  async function copyPixCode() {
    const code = state.value.data?.br_code
    if (!code || !import.meta.client) return false
    try {
      await navigator.clipboard.writeText(code)
      return true
    } catch {
      state.value.error = 'Não foi possível copiar automaticamente. Selecione o código e copie manualmente.'
      return false
    }
  }

  return { state, reset, createDeposit, checkPayment, copyPixCode }
}

function apiErrorMessage(error: any, fallback: string) {
  return error?.data?.detail?.message
    || error?.data?.message
    || error?.message
    || fallback
}
