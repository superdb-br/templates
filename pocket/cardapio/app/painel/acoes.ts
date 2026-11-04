'use server';

// O que o dono faz no painel. Cada ação confere a sessão, e o RLS confere de novo.

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

export async function criarLoja(f: FormData) {
  await fazer((s) => dados(s.from('config_loja').insert({ nome: texto(f, 'nome') })));
}

/** A chave Pix é conferida e normalizada aqui, antes de virar BR Code na página do cliente. */
export async function salvarPix(f: FormData) {
  await fazer(async (s) => {
    let chave: string;
    try {
      chave = normalizarChavePix(texto(f, 'chave_pix')).valor;
    } catch {
      throw new Error('Confira a chave Pix: CPF, CNPJ, e-mail, telefone com DDD ou chave aleatória.');
    }
    await dados(
      s
        .from('config_loja')
        .update({ chave_pix: chave, nome_recebedor: texto(f, 'nome_recebedor'), cidade: texto(f, 'cidade'), aberta: f.get('aberta') === 'on' })
        .eq('id', texto(f, 'loja_id')),
    );
  });
}

export async function criarCategoria(f: FormData) {
  await fazer((s) => dados(s.from('categorias').insert({ loja_id: texto(f, 'loja_id'), nome: texto(f, 'nome') })));
}

export async function criarProduto(f: FormData) {
  await fazer((s) =>
    dados(
      s.from('produtos').insert({
        loja_id: texto(f, 'loja_id'),
        categoria_id: texto(f, 'categoria_id') || null,
        nome: texto(f, 'nome'),
        descricao: texto(f, 'descricao') || null,
        preco_centavos: centavos(texto(f, 'preco')),
        foto_url: texto(f, 'foto_url') || null,
      }),
    ),
  );
}

export async function alternarProduto(f: FormData) {
  await fazer((s) => dados(s.from('produtos').update({ ativo: f.get('ativo') === 'true' }).eq('id', texto(f, 'id'))));
}

export async function mudarStatus(f: FormData) {
  await fazer((s) => dados(s.from('pedidos').update({ status: texto(f, 'status') }).eq('id', texto(f, 'id'))));
}

/** Apaga o pedido, os itens e o nome e o telefone do cliente. */
export async function apagarPedido(f: FormData) {
  await fazer((s) => dados(s.from('pedidos').delete().eq('id', texto(f, 'id'))));
}
