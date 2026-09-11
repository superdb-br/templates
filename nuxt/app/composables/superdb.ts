// O cliente do SuperDB deste app, disponível em qualquer componente (o Nuxt
// importa sozinho o que está em app/composables):
//
//   const { superdb } = useSuperDB()
//   const { data, error } = await superdb.from('tarefas').select()
//
// O `app` embrulha o cliente com a sessão que se renova sozinha (entrar,
// criarConta, sair, aoMudar). Ver app/lib/superdb/sessao.ts.

import type { Session } from '@superdb/client'
import { criarSuperDB, type SuperDB } from '~/lib/superdb/sessao'

/** Os nomes das variáveis, para a tela de configuração dizer exatamente qual falta. */
export const NOMES = {
  url: 'NUXT_PUBLIC_SUPERDB_URL',
  anonKey: 'NUXT_PUBLIC_SUPERDB_ANON_KEY',
  projeto: 'NUXT_PUBLIC_SUPERDB_PROJECT',
}

let instancia: SuperDB | null = null

export function useSuperDB() {
  const publico = useRuntimeConfig().public
  const config = {
    url: String(publico.superdbUrl ?? ''),
    anonKey: String(publico.superdbAnonKey ?? ''),
    projeto: String(publico.superdbProject ?? ''),
  }
  instancia ??= criarSuperDB(config)
  return {
    app: instancia,
    superdb: instancia.superdb,
    config,
    configurado: Boolean(config.url && config.anonKey && config.projeto),
  }
}

/** A sessão como estado reativo: muda no login, na saída, na renovação e em outra aba. */
export function useSessao() {
  const { app, configurado } = useSuperDB()
  const sessao = useState<Session | null>('superdb-sessao', () => null)
  const carregando = useState('superdb-carregando', () => configurado)

  if (configurado && import.meta.client) {
    onMounted(() => {
      app
        .sessao()
        .then((s) => (sessao.value = s))
        .catch(() => undefined)
        .finally(() => (carregando.value = false))
    })
    const parar = app.aoMudar((s) => (sessao.value = s))
    onScopeDispose(parar)
  }

  return { sessao, carregando }
}
