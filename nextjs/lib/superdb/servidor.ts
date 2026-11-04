// O cliente do SuperDB para Server Components, Server Actions e Route Handlers.
//
//   const superdb = await superdbDoServidor();
//   const { data, error } = await superdb.from('tarefas').select();
//
// Crie um por requisição (é barato): ele lê a sessão dos cookies DESTA
// requisição, então cada visitante enxerga só os próprios dados. Nunca guarde
// o cliente numa variável de módulo: ela seria compartilhada entre visitantes.

import 'server-only';
import { cookies } from 'next/headers';
import { createClient, type Session } from '@superdb/client';
import { config } from './config';
import { OPCOES_DO_COOKIE, armazenamentoEmCookies } from './cookies';

export async function superdbDoServidor() {
  const pote = await cookies();
  const armazenamento = armazenamentoEmCookies({
    ler: (nome) => pote.get(nome)?.value,
    // Só funciona em Server Action e Route Handler. Numa página, o SDK só lê.
    gravar: (nome, valor) => pote.set(nome, valor, OPCOES_DO_COOKIE),
    apagar: (nome) => pote.delete(nome),
  });
  // Quem renova é o proxy.ts (renovar.ts): aqui, renovar trocaria o refresh
  // token sem poder regravar o cookie, e o próximo pedido cairia como reuso.
  // Em spread para compilar também contra a 0.2, que não tem a opção.
  const semRenovacaoDoSdk = { autoRefreshToken: false };
  return createClient(config.url, config.anonKey, { project: config.projeto, storage: armazenamento, ...semRenovacaoDoSdk });
}

/** Quem está logado nesta requisição, ou `null`. */
export async function sessaoAtual(): Promise<Session | null> {
  const superdb = await superdbDoServidor();
  return (await superdb.auth.getSession()).data.session;
}
