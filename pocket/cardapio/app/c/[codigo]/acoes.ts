'use server';

// O pedido do cliente, sem conta. O navegador manda só id e quantidade; o preço
// e o total saem do banco (fazer_pedido), com a chave anon.

import { redirect } from 'next/navigation';
import { superdbDoServidor } from '@/lib/superdb/servidor';
import { ERROS } from '@/lib/modelo';

export async function pedir(f: FormData) {
  const v = (k: string) => String(f.get(k) ?? '').trim();
  const codigo = v('codigo');
  const itens = [...f.entries()]
    .filter(([k, q]) => k.startsWith('qtd:') && Number(q) > 0)
    .map(([k, q]) => ({ produto_id: k.slice(4), quantidade: Number(q) }));

  if (itens.length === 0) redirect(`/c/${encodeURIComponent(codigo)}?erro=${encodeURIComponent('Escolha pelo menos um item.')}`);

  const superdb = await superdbDoServidor();
  const { data, error } = await superdb.rpc('fazer_pedido', {
    p_codigo: codigo,
    p_nome: v('nome'),
    p_telefone: v('telefone'),
    p_observacao: v('observacao'),
    p_itens: itens,
  });
  if (error) {
    const msg = ERROS[error.message ?? ''] ?? 'Não deu para fazer o pedido agora. Tente de novo.';
    redirect(`/c/${encodeURIComponent(codigo)}?erro=${encodeURIComponent(msg)}`);
  }
  redirect(`/pedido/${(data as { id: string }).id}`);
}
