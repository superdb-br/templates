// O cliente do SuperDB deste app. Importe daqui em qualquer tela:
//
//   import { superdb } from './superdb';
//   const { data, error } = await superdb.from('tarefas').select();
//
// No celular não existe localStorage: a sessão fica no AsyncStorage, que
// sobrevive a fechar e abrir o app. O `app` embrulha o cliente com a sessão que
// se renova sozinha (entrar, criarConta, sair, aoMudar). Ver src/lib/superdb/sessao.ts.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { criarSuperDB } from './lib/superdb/sessao';

export const config = {
  url: process.env.EXPO_PUBLIC_SUPERDB_URL ?? '',
  anonKey: process.env.EXPO_PUBLIC_SUPERDB_ANON_KEY ?? '',
  projeto: process.env.EXPO_PUBLIC_SUPERDB_PROJECT ?? '',
};

/** Os nomes das variáveis, para a tela de configuração dizer exatamente qual falta. */
export const NOMES = {
  url: 'EXPO_PUBLIC_SUPERDB_URL',
  anonKey: 'EXPO_PUBLIC_SUPERDB_ANON_KEY',
  projeto: 'EXPO_PUBLIC_SUPERDB_PROJECT',
};

export const configurado = Boolean(config.url && config.anonKey && config.projeto);

export const app = criarSuperDB({ ...config, armazenamento: AsyncStorage });
export const superdb = app.superdb;
