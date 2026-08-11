import process from 'node:process'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  modules: ['@nuxt/icon', '@vite-pwa/nuxt'],
  css: ['~/assets/css/main.css'],
  // Sem isto o SSR tenta resolver cada ícone por fetch e falha (URL relativa no
  // servidor), deixando os ícones ausentes no HTML até o cliente hidratar.
  // O clientBundle varre o código, embute só os ícones usados e o loadIcon os
  // encontra em memória — tanto no SSR quanto no cliente, sem rede.
  icon: {
    clientBundle: { scan: true },
    // Coleção local como fallback para nomes resolvidos em runtime.
    serverBundle: { collections: ['lucide'] }
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'https://routes-eb.grupoautoma.com',
      appName: process.env.NUXT_PUBLIC_APP_NAME || 'Clube da BB Slots',
      depositUrl: process.env.NUXT_PUBLIC_DEPOSIT_URL || ''
    }
  },
  app: {
    head: {
      titleTemplate: '%s · Clube da BB Slots',
      meta: [
        { name: 'theme-color', content: '#ff1493' },
        { name: 'description', content: 'Catálogo de slots da Esportiva.' }
      ],
      link: [
        { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
        { rel: 'icon', href: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png', sizes: '180x180' }
      ]
    }
  },
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      id: '/?source=pwa-esportiva-slots-v2',
      name: 'Clube da BB Slots',
      short_name: 'Clube da BB',
      description: 'Slots da Esportiva em um app rápido e seguro.',
      theme_color: '#ff1493',
      background_color: '#0b0c0e',
      display: 'standalone',
      start_url: '/?source=pwa-esportiva-slots-v2',
      icons: [
        { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any maskable' }
      ]
    },
    workbox: {
      cacheId: 'esportiva-slots-v3',
      navigateFallback: null,
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/routes-eb\.grupoautoma\.com\//,
          handler: 'NetworkOnly'
        }
      ]
    },
    devOptions: { enabled: false }
  },
  typescript: { strict: true, typeCheck: true }
})
