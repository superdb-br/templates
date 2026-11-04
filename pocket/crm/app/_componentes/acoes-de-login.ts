'use server';

// Login, cadastro e saída de quem usa o app (o dono do salão, da loja, do evento).
// Rodam no servidor: a senha vai direto do formulário para cá, e os tokens
// voltam só como cookies httpOnly (a página nunca os vê).

import { redirect } from 'next/navigation';
import { MODELO } from '@/lib/modelo';
import { superdbDoServidor } from '@/lib/superdb/servidor';
import { traduzirErroDeLogin } from '@/lib/superdb/erros';

export type EstadoDoLogin = { erro: string | null; email: string };

export async function entrarOuCriarConta(_anterior: EstadoDoLogin, form: FormData): Promise<EstadoDoLogin> {
  const email = String(form.get('email') ?? '').trim();
  const senha = String(form.get('senha') ?? '');
  const superdb = await superdbDoServidor();

  const { error } =
    form.get('modo') === 'criar'
      ? await superdb.auth.signUp({ email, password: senha })
      : await superdb.auth.signInWithPassword({ email, password: senha });

  if (error) return { erro: traduzirErroDeLogin(error).message, email };
  redirect(MODELO.paginaDoDono);
}

export async function sair() {
  const superdb = await superdbDoServidor();
  await superdb.auth.signOut().catch(() => undefined);
  redirect('/');
}
