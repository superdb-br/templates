'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { exigirSessao, dados } from '../_componentes/sessao';
import { mensagemDe } from '@/lib/superdb/erros';

const texto = (f: FormData, k: string) => String(f.get(k) ?? '').trim();

async function fazer(acao: (superdb: Awaited<ReturnType<typeof exigirSessao>>['superdb']) => Promise<unknown>, voltar = '/painel') {
  const { superdb } = await exigirSessao();
  let erro: string | null = null;
  try {
    await acao(superdb);
  } catch (falha) {
    erro = mensagemDe(falha);
  }
  revalidatePath('/painel');
  redirect(erro ? `${voltar}${voltar.includes('?') ? '&' : '?'}erro=${encodeURIComponent(erro)}` : voltar);
}

export async function criarEvento(f: FormData) {
  // O campo datetime-local vem sem fuso: é a hora de Brasília.
  const quando = `${texto(f, 'quando')}:00-03:00`;
  await fazer((s) =>
    dados(s.from('eventos').insert({ titulo: texto(f, 'titulo'), quando, local: texto(f, 'local') || null, descricao: texto(f, 'descricao') || null })),
  );
}

export async function alternarRespostas(f: FormData) {
  const id = texto(f, 'id');
  await fazer((s) => dados(s.from('eventos').update({ aceita_respostas: f.get('aceita') === 'true' }).eq('id', id)), `/painel?evento=${id}`);
}

export async function apagarResposta(f: FormData) {
  await fazer((s) => dados(s.from('convidados_resposta').delete().eq('id', texto(f, 'id'))), `/painel?evento=${texto(f, 'evento')}`);
}
