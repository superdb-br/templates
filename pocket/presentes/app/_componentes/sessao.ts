import 'server-only';
import { redirect } from 'next/navigation';
import type { Session, SupabaseClient } from '@superdb/client';
import { superdbDoServidor } from '@/lib/superdb/servidor';
import { traduzirErroDeDados } from '@/lib/superdb/erros';

/** Página do dono: sem sessão, volta para o login. A página confere; o proxy só renova. */
export async function exigirSessao(): Promise<{ superdb: SupabaseClient; sessao: Session }> {
  const superdb = await superdbDoServidor();
  const sessao = (await superdb.auth.getSession()).data.session;
  if (!sessao) redirect('/entrar');
  return { superdb, sessao };
}

type Resposta = { data: unknown; error: { code?: string; message?: string; details?: string } | null; status?: number };

/** O `data` de uma consulta, ou o erro já traduzido para português. */
export async function dados<T = unknown>(consulta: PromiseLike<Resposta>): Promise<T> {
  const { data, error, status } = await consulta;
  if (error) throw traduzirErroDeDados(error, status ?? 0);
  return data as T;
}
