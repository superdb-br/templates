'use server';

// As mutações da lista. Server Actions são endpoints públicos: qualquer um pode
// chamá-las com qualquer `id`. Por isso cada uma confere a sessão aqui, e o
// banco confere de novo (o RLS só deixa mexer nas próprias tarefas).

import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@superdb/client';
import { superdbDoServidor } from '@/lib/superdb/servidor';
import { alternarTarefa, apagarTarefa, criarTarefa } from '@/lib/superdb/tarefas';
import { mensagemDe } from '@/lib/superdb/erros';

export type Resultado = { erro: string | null };

async function comSessao(fazer: (superdb: SupabaseClient) => Promise<unknown>): Promise<Resultado> {
  const superdb = await superdbDoServidor();
  if (!(await superdb.auth.getSession()).data.session) {
    return { erro: 'Sua sessão expirou. Entre de novo.' };
  }
  try {
    await fazer(superdb);
  } catch (falha) {
    return { erro: mensagemDe(falha) };
  }
  revalidatePath('/tarefas');
  return { erro: null };
}

export async function adicionar(titulo: string) {
  return comSessao((superdb) => criarTarefa(superdb, titulo));
}

export async function alternar(id: string, feita: boolean) {
  return comSessao((superdb) => alternarTarefa(superdb, id, feita));
}

export async function apagar(id: string) {
  return comSessao((superdb) => apagarTarefa(superdb, id));
}
