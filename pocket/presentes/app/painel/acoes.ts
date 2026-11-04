'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { exigirSessao, dados } from '../_componentes/sessao';
import { mensagemDe } from '@/lib/superdb/erros';
import { normalizarChavePix } from '@/lib/pix/brcode';

const texto = (f: FormData, k: string) => String(f.get(k) ?? '').trim();
const centavos = (v: string) => Math.round(Number(v.replace(/\./g, '').replace(',', '.')) * 100);

async function fazer(acao: (superdb: Awaited<ReturnType<typeof exigirSessao>>['superdb']) => Promise<unknown>) {
  const { superdb } = await exigirSessao();
  let erro: string | null = null;
  try {
    await acao(superdb);
  } catch (falha) {
    erro = mensagemDe(falha);
  }
  revalidatePath('/painel');
  redirect(erro ? `/painel?erro=${encodeURIComponent(erro)}` : '/painel');
}

export async function criarLista(f: FormData) {
  await fazer((s) => dados(s.from('listas').insert({ titulo: texto(f, 'titulo'), mensagem: texto(f, 'mensagem') || null })));
}

/** A chave é conferida e normalizada aqui, antes de virar BR Code na página do convidado. */
export async function salvarPix(f: FormData) {
  await fazer(async (s) => {
    let chave: string;
    try {
      chave = normalizarChavePix(texto(f, 'chave_pix')).valor;
    } catch {
      throw new Error('Confira a chave Pix: CPF, CNPJ, e-mail, telefone com DDD ou chave aleatória.');
    }
    await dados(
      s.from('listas').update({ chave_pix: chave, nome_recebedor: texto(f, 'nome_recebedor'), cidade: texto(f, 'cidade') }).eq('id', texto(f, 'lista_id')),
    );
  });
}

export async function criarItem(f: FormData) {
  await fazer((s) =>
    dados(s.from('itens').insert({ lista_id: texto(f, 'lista_id'), nome: texto(f, 'nome'), descricao: texto(f, 'descricao') || null, valor_centavos: centavos(texto(f, 'valor')) })),
  );
}

export async function mudarStatus(f: FormData) {
  await fazer((s) => dados(s.from('itens').update({ status: texto(f, 'status') }).eq('id', texto(f, 'id'))));
}

export async function apagarContribuicao(f: FormData) {
  await fazer((s) => dados(s.from('contribuicoes').delete().eq('id', texto(f, 'id'))));
}
