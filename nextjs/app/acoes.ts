'use server';

// Login, cadastro e saída. Rodam no servidor: a senha vai direto do formulário
// para cá, e os tokens voltam só como cookies httpOnly (a página nunca os vê).

import { redirect } from 'next/navigation';
import { superdbDoServidor } from '@/lib/superdb/servidor';
import { traduzirErroDeLogin } from '@/lib/superdb/erros';

export type EstadoDoLogin = { erro: string | null; email: string };

export async function entrarOuCriarConta(_anterior: EstadoDoLogin, form: FormData): Promise<EstadoDoLogin> {
  const email = String(form.get('email') ?? '').trim();
  const senha = String(form.get('senha') ?? '');
  const superdb = await superdbDoServidor();

  // O SDK grava a sessão pelo armazenamento de cookies (lib/superdb/cookies.ts).
  const { error } =
    form.get('modo') === 'criar'
      ? await superdb.auth.signUp({ email, password: senha })
      : await superdb.auth.signInWithPassword({ email, password: senha });

  if (error) return { erro: traduzirErroDeLogin(error).message, email };
  redirect('/tarefas');
}

export async function sair() {
  const superdb = await superdbDoServidor();
  // Encerra a sessão no SuperDB e apaga os cookies, mesmo se o servidor não responder.
  await superdb.auth.signOut().catch(() => undefined);
  redirect('/');
}
