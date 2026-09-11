// A sessão como estado reativo do Vue: muda sozinha no login, na saída, na
// renovação e quando outra aba entra ou sai.

import { onScopeDispose, ref, shallowRef } from 'vue'
import type { Session } from '@superdb/client'
import { app, configurado } from './superdb'

export function usarSessao() {
  const sessao = shallowRef<Session | null>(null)
  const carregando = ref(configurado)

  if (configurado) {
    app
      .sessao()
      .then((s) => (sessao.value = s))
      .catch(() => undefined)
      .finally(() => (carregando.value = false))
    const parar = app.aoMudar((s) => (sessao.value = s))
    onScopeDispose(parar)
  }

  return { sessao, carregando }
}
