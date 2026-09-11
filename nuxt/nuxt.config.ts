// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // App de página única (SPA): o login e as tarefas acontecem no navegador, e a
  // sessão fica no localStorage. `npm run generate` gera arquivos estáticos.
  ssr: false,

  css: ['~/assets/estilo.css'],

  app: {
    head: {
      title: 'Tarefas · Nuxt + SuperDB',
      htmlAttrs: { lang: 'pt-BR' },
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },

  // Preenchidas pelas variáveis NUXT_PUBLIC_SUPERDB_* do .env (ver .env.example).
  runtimeConfig: {
    public: {
      superdbUrl: '',
      superdbAnonKey: '',
      superdbProject: '',
    },
  },
})
