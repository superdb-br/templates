// A lista de respostas em CSV (abre no Excel e no Google Planilhas). Com a
// sessão do anfitrião: o RLS só devolve as respostas dos eventos dele.

import { superdbDoServidor } from '@/lib/superdb/servidor';
import { celula } from '@/lib/modelo';

type Resposta = { nome: string; vai: boolean; quantidade: number; recado: string | null; criado_em: string };

export async function GET(_pedido: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const superdb = await superdbDoServidor();
  if (!(await superdb.auth.getSession()).data.session) return new Response('Entre de novo.', { status: 401 });
  const { data, error } = await superdb
    .from('convidados_resposta')
    .select('nome, vai, quantidade, recado, criado_em')
    .eq('evento_id', id)
    .order('criado_em');
  if (error) return new Response('Não deu para gerar o CSV.', { status: 500 });
  const linhas = [
    ['nome', 'vai', 'pessoas', 'recado', 'respondeu_em'].map(celula).join(','),
    ...((data as Resposta[]) ?? []).map((r) => [r.nome, r.vai ? 'sim' : 'não', r.quantidade, r.recado, r.criado_em].map(celula).join(',')),
  ];
  return new Response('﻿' + linhas.join('\r\n'), {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="presenca.csv"' },
  });
}
