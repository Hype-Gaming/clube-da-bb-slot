type AuthUser = {
  id?: string | number
  name?: string
  email?: string
}

type AuthSession = {
  token: string
  cookieKey: string
  user: AuthUser | null
  balance: number | null
}

const STORAGE_KEY = 'esportiva-slots_auth'
const BRAND_HEADERS = {
  'X-Brand-Slug': 'esportiva',
  'X-Base-Domain': 'bet.br'
}

const emptySession = (): AuthSession => ({ token: '', cookieKey: '', user: null, balance: null })

export const useAuth = () => {
  const session = useState<AuthSession>('esportiva-slots-session', emptySession)
  const ready = useState('esportiva-slots-ready', () => false)
  const config = useRuntimeConfig()
  const loggedIn = computed(() => Boolean(session.value.token))

  function persist() {
    if (!import.meta.client) return
    if (session.value.token) localStorage.setItem(STORAGE_KEY, JSON.stringify(session.value))
    else localStorage.removeItem(STORAGE_KEY)
  }

  function hydrate() {
    if (!import.meta.client || ready.value) return
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (typeof parsed?.token === 'string') session.value = { ...emptySession(), ...parsed }
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    ready.value = true
  }

  async function login(identifier: string, password: string) {
    const isCpf = /^[\d.\-\s]+$/.test(identifier) && identifier.replace(/\D/g, '').length === 11
    const email = isCpf ? identifier.replace(/\D/g, '') : identifier.trim()
    const response = await $fetch<any>('/api/auth/login', {
      baseURL: config.public.apiBase,
      method: 'POST',
      headers: BRAND_HEADERS,
      body: {
        email,
        password,
        brand_slug: 'esportiva',
        base_domain: 'bet.br',
        app_source: 'web',
        save_cookies: true
      }
    })
    const payload = response?.payload || response?.data || response
    const token = payload?.token || payload?.access_token
    if (!token) throw new Error(response?.message || 'Não foi possível iniciar sua sessão.')
    session.value = {
      token,
      cookieKey: payload?.cookie_key || payload?.cookieKey || '',
      user: payload?.user || payload?.customer || null,
      balance: toBalance(payload?.balance ?? payload?.user?.balance)
    }
    persist()
    return session.value
  }

  function authHeaders() {
    return {
      ...BRAND_HEADERS,
      Authorization: `Bearer ${session.value.token}`,
      ...(session.value.cookieKey ? { 'X-Cactus-Cookie-Key': session.value.cookieKey } : {})
    }
  }

  async function authorizedFetch<T>(path: string, options: Record<string, any> = {}) {
    try {
      return await $fetch<T>(path, {
        ...options,
        baseURL: config.public.apiBase,
        headers: { ...authHeaders(), ...(options.headers || {}) }
      })
    } catch (error: any) {
      if (error?.status === 401 || error?.statusCode === 401 || error?.response?.status === 401) {
        logout(true)
      }
      throw error
    }
  }

  async function refreshAccount() {
    if (!session.value.token) return
    const response = await authorizedFetch<any>('/api/me')
    const payload = response?.payload || response?.data || response
    session.value.user = payload?.user || payload || session.value.user
    session.value.balance = toBalance(payload?.balance ?? payload?.user?.balance ?? session.value.balance)
    persist()
  }

  function logout(expired = false) {
    session.value = emptySession()
    persist()
    if (import.meta.client) navigateTo(`/auth/login${expired ? '?expired=1' : ''}`)
  }

  return { session, ready, loggedIn, hydrate, login, logout, refreshAccount, authorizedFetch }
}

function toBalance(value: unknown): number | null {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}
