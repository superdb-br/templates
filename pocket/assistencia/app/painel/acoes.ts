'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { exigirSessao, dados } from '../_componentes/sessao';
import { mensagemDe } from '@/lib/superdb/erros';
import { centavosDe, traduzirRegra } from '@/lib/modelo';
import { notaDaOrdem } from '@/lib/fiscal';

type Superdb = Awaited<ReturnType<typeof exigirSessao>>['superdb'];

const texto = (f: FormData, k: string) => String(f.get(k) ?? '').trim();
const ouNulo = (f: FormData, k: string) => texto(f, k) || null;
const digitos = (f: FormData, k: string) => texto(f, k).replace(/\D/g, '') || null;

/** Faz a ação com a sessão de quem está logado e volta para `destino`, com o erro ou o aviso. */
async function fazer(destino: string, acao: (superdb: Superdb) => Promise<string | void>) {
  const { superdb } = await exigirSessao();
  let erro: string | null = null;
  let aviso: string | null = null;
  try {
    aviso = (await acao(superdb)) ?? null;
  } catch (falha) {
    erro = traduzirRegra(mensagemDe(falha));
  }
  revalidatePath(destino);
  const q = erro ? `?erro=${encodeURIComponent(erro)}` : aviso ? `?aviso=${encodeURIComponent(aviso)}` : '';
  redirect(`${destino}${q}`);
}

// ── Clientes ──────────────────────────────────────────────────────────────
export async function criarCliente(f: FormData) {
  const temEndereco = texto(f, 'logradouro') || texto(f, 'cep');
  await fazer('/painel/clientes', async (s) => {
    await dados(
      s.from('clientes').insert({
        nome: texto(f, 'nome'),
        documento: digitos(f, 'documento'),
        telefone: ouNulo(f, 'telefone'),
        email: ouNulo(f, 'email'),
        endereco: temEndereco
          ? {
              logradouro: texto(f, 'logradouro'),
              numero: texto(f, 'numero'),
              bairro: texto(f, 'bairro'),
              codigo_municipio: texto(f, 'codigo_municipio').replace(/\D/g, ''),
              cep: texto(f, 'cep').replace(/\D/g, ''),
            }
          : null,
      }),
    );
  });
}

// ── Ordens ────────────────────────────────────────────────────────────────
export async function abrirOrdem(f: FormData) {
  const { superdb } = await exigirSessao();
  let erro: string | null = null;
  let id: string | null = null;
  try {
    const ordem = await dados<{ id: string }>(
      superdb
        .from('ordens_servico')
        .insert({ cliente_id: texto(f, 'cliente_id'), equipamento: texto(f, 'equipamento'), defeito: texto(f, 'defeito') })
        .select('id')
        .single(),
    );
    id = ordem.id;
  } catch (falha) {
    erro = traduzirRegra(mensagemDe(falha));
  }
  revalidatePath('/painel');
  redirect(id ? `/painel/ordem/${id}` : `/painel?erro=${encodeURIComponent(erro ?? 'Não deu para abrir a ordem.')}`);
}

/** O preço vai zero de propósito: o banco põe o de tabela (gatilho itens_da_ordem_guarda). */
export async function lancarItem(f: FormData) {
  const ordem = texto(f, 'ordem_id');
  await fazer(`/painel/ordem/${ordem}`, async (s) => {
    const quantidade = Math.max(1, Math.min(999, Number(texto(f, 'quantidade')) || 1));
    await dados(s.from('itens_ordem').insert({ ordem_id: ordem, item_id: texto(f, 'item_id'), quantidade, preco_unitario_centavos: 0 }));
  });
}

export async function tirarItem(f: FormData) {
  const ordem = texto(f, 'ordem_id');
  await fazer(`/painel/ordem/${ordem}`, async (s) => {
    await dados(s.from('itens_ordem').delete().eq('id', texto(f, 'id')));
  });
}

export async function mudarStatus(f: FormData) {
  const ordem = texto(f, 'ordem_id');
  await fazer(`/painel/ordem/${ordem}`, async (s) => {
    await dados(s.rpc('mudar_status_ordem', { p_ordem: ordem, p_status: texto(f, 'status') }));
  });
}

/**
 * Entregar: o banco baixa as peças e fecha a ordem numa transação só. Depois,
 * com serviço na ordem, o servidor emite a NFS-e. Se a nota falhar, a ordem
 * continua entregue e a tela oferece "Emitir a nota" de novo (mesma ref, sem duplicar).
 */
export async function entregar(f: FormData) {
  const ordem = texto(f, 'ordem_id');
  await fazer(`/painel/ordem/${ordem}`, async (s) => {
    const fechada = await dados<{ total_servicos_centavos: number }>(s.rpc('entregar_ordem', { p_ordem: ordem }));
    if (Number(fechada.total_servicos_centavos) <= 0) return 'Ordem entregue. Só peça: não há serviço para a NFS-e.';
    const nota = await notaDaOrdem(s, ordem);
    if (!nota.ok) throw new Error(`Ordem entregue e estoque baixado. A nota não saiu: ${nota.mensagem}`);
    return nota.ambiente === 'producao' ? 'Ordem entregue e NFS-e pedida.' : 'Ordem entregue e nota de teste pedida (homologação, sem valor fiscal).';
  });
}

export async function emitirNota(f: FormData) {
  const ordem = texto(f, 'ordem_id');
  await fazer(`/painel/ordem/${ordem}`, async (s) => {
    const nota = await notaDaOrdem(s, ordem);
    if (!nota.ok) throw new Error(nota.mensagem);
    return `Situação da nota: ${nota.situacao}.`;
  });
}

// ── Estoque (só o dono; o banco confere) ────────────────────────────────────
export async function cadastrarItem(f: FormData) {
  await fazer('/painel/estoque', async (s) => {
    const preco = centavosDe(texto(f, 'preco'));
    if (preco === null) throw new Error('Preço inválido.');
    await dados(
      s.from('catalogo').insert({
        sku: texto(f, 'sku').toUpperCase(),
        nome: texto(f, 'nome'),
        tipo: texto(f, 'tipo'),
        preco_centavos: preco,
        estoque_minimo: Math.max(0, Number(texto(f, 'estoque_minimo')) || 0),
      }),
    );
  });
}

export async function mudarPreco(f: FormData) {
  await fazer('/painel/estoque', async (s) => {
    const preco = centavosDe(texto(f, 'preco'));
    if (preco === null) throw new Error('Preço inválido.');
    await dados(s.from('catalogo').update({ preco_centavos: preco }).eq('id', texto(f, 'id')));
  });
}

export async function movimentarEstoque(f: FormData) {
  await fazer('/painel/estoque', async (s) => {
    const novo = await dados<number>(
      s.rpc('movimentar_estoque', { p_item: texto(f, 'id'), p_quantidade: Math.trunc(Number(texto(f, 'quantidade'))), p_motivo: texto(f, 'motivo') }),
    );
    return `Estoque agora: ${novo}.`;
  });
}

// ── Equipe (só o dono; o banco confere) ─────────────────────────────────────
export async function porNaEquipe(f: FormData) {
  await fazer('/painel/equipe', async (s) => {
    await dados(s.from('equipe').insert({ user_id: texto(f, 'user_id'), nome: texto(f, 'nome'), papel: texto(f, 'papel') }));
  });
}

export async function tirarDaEquipe(f: FormData) {
  await fazer('/painel/equipe', async (s) => {
    await dados(s.from('equipe').delete().eq('user_id', texto(f, 'user_id')));
  });
}
