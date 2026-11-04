'use server';

// Criar, editar e apagar numa tabela qualquer. Quem decide se pode é o banco
// (as policies com papel_no_painel()); aqui só conferimos a sessão e o nome.

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { exigirSessao, dados } from '../../_componentes/sessao';
import { mensagemDe } from '@/lib/superdb/erros';
import { nomeValido } from '@/lib/modelo';

function linhaDoFormulario(f: FormData) {
  const linha: Record<string, string | null> = {};
  for (const [k, v] of f.entries()) {
    if (!k.startsWith('col:')) continue;
    const coluna = k.slice(4);
    if (nomeValido(coluna)) linha[coluna] = String(v) === '' ? null : String(v);
  }
  return linha;
}

async function fazer(tabela: string, acao: (s: Awaited<ReturnType<typeof exigirSessao>>['superdb']) => Promise<unknown>) {
  if (!nomeValido(tabela)) redirect('/painel');
  const { superdb } = await exigirSessao();
  let erro: string | null = null;
  try {
    await acao(superdb);
  } catch (falha) {
    erro = mensagemDe(falha);
  }
  revalidatePath(`/painel/${tabela}`);
  redirect(erro ? `/painel/${tabela}?erro=${encodeURIComponent(erro)}` : `/painel/${tabela}`);
}

export async function criar(f: FormData) {
  const tabela = String(f.get('tabela'));
  await fazer(tabela, (s) => dados(s.from(tabela).insert(linhaDoFormulario(f))));
}

export async function editar(f: FormData) {
  const tabela = String(f.get('tabela'));
  await fazer(tabela, (s) => dados(s.from(tabela).update(linhaDoFormulario(f)).eq('id', String(f.get('id')))));
}

export async function apagar(f: FormData) {
  const tabela = String(f.get('tabela'));
  await fazer(tabela, (s) => dados(s.from(tabela).delete().eq('id', String(f.get('id')))));
}
