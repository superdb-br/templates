// As variáveis que o Vite expõe ao app (as que começam com VITE_).
interface ImportMetaEnv {
  readonly VITE_SUPERDB_URL?: string
  readonly VITE_SUPERDB_ANON_KEY?: string
  readonly VITE_SUPERDB_PROJECT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
