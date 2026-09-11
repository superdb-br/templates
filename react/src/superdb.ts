// O cliente do SuperDB deste app. Importe daqui em qualquer componente:
//
//   import { superdb } from './superdb'
//   const { data, error } = await superdb.from('tarefas').select()
//
// O `app` embrulha o cliente com a sessão que se renova sozinha (entrar,
// criarConta, sair, aoMudar). Ver src/lib/superdb/sessao.ts.

import { criarSuperDB } from './lib/superdb/sessao'

export const config = {
  url: import.meta.env.VITE_SUPERDB_URL ?? '',
  anonKey: import.meta.env.VITE_SUPERDB_ANON_KEY ?? '',
  projeto: import.meta.env.VITE_SUPERDB_PROJECT ?? '',
}

/** Os nomes das variáveis, para a tela de configuração dizer exatamente qual falta. */
export const NOMES = {
  url: 'VITE_SUPERDB_URL',
  anonKey: 'VITE_SUPERDB_ANON_KEY',
  projeto: 'VITE_SUPERDB_PROJECT',
}

export const configurado = Boolean(config.url && config.anonKey && config.projeto)

export const app = criarSuperDB(config)
export const superdb = app.superdb
