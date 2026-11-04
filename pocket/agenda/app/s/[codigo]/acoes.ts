'use server';

// O cliente marca sem conta. Quem confere tudo (horário livre, serviço do salão,
// nome e telefone) é a função agendar() do banco, com a chave anon.

import { redirect } from 'next/navigation';
import { superdbDoServidor } from '@/lib/superdb/servidor';
import { ERROS } from '@/lib/modelo';

export async function marcar(f: FormData) {
  const v = (k: string) => String(f.get(k) ?? '').trim();
  const codigo = v('codigo');
  const superdb = await superdbDoServidor();
  const { error } = await superdb.rpc('agendar', {
    p_codigo: codigo,
    p_servico: v('servico'),
    p_profissional: v('profissional'),
    p_inicio: v('inicio'),
    p_nome: v('nome'),
    p_telefone: v('telefone'),
  });
  const volta = new URLSearchParams({ servico: v('servico'), profissional: v('profissional'), dia: v('dia') });
  if (error) {
    volta.set('erro', ERROS[error.message ?? ''] ?? 'Não deu para marcar agora. Tente de novo.');
    redirect(`/s/${encodeURIComponent(codigo)}?${volta}`);
  }
  volta.set('marcado', v('inicio'));
  redirect(`/s/${encodeURIComponent(codigo)}?${volta}`);
}
