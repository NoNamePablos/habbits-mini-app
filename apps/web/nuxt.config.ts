import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },

  modules: [
    '@pinia/nuxt',
    'shadcn-nuxt',
    '@nuxt/eslint',
    '@nuxtjs/i18n',
  ],

  i18n: {
    locales: [
      { code: 'ru', name: 'Русский', file: 'ru.json' },
      { code: 'en', name: 'English', file: 'en.json' },
    ],
    lazy: true,
    langDir: 'locales',
    defaultLocale: 'ru',
    strategy: 'no_prefix',
    detectBrowserLanguage: false,
    vueI18n: './i18n.config.ts',
  },

  shadcn: {
    prefix: '',
    componentDir: './components/ui',
  },

  css: ['~/assets/css/tailwind.css', '~/assets/scss/main.scss'],

  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: ['.trycloudflare.com'],
      hmr: {
        protocol: 'wss',
        clientPort: 443,
        host: process.env.TUNNEL_HOST || 'localhost',
      },
    },
  },

  runtimeConfig: {
    public: {
      apiBase: '/api',
    },
  },

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      title: 'Habits Tracker',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700&display=swap' },
      ],
      script: [
        { src: 'https://telegram.org/js/telegram-web-app.js' },
      ],
    },
  },

  ssr: false,
})
