'use server';

// O que o dono faz no painel. Server Actions são endpoints públicos: cada uma
// confere a sessão, e o banco confere de novo (o RLS só deixa mexer no próprio salão).

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

export async function criarSalao(f: FormData) {
  await fazer((s) => dados(s.from('saloes').insert({ nome: texto(f, 'nome') })));
}

export async function criarServico(f: FormData) {
  await fazer((s) =>
    dados(
      s.from('servicos').insert({
        salao_id: texto(f, 'salao_id'),
        nome: texto(f, 'nome'),
        duracao_min: Number(texto(f, 'duracao_min')),
        preco_centavos: Math.round(Number(texto(f, 'preco').replace(',', '.')) * 100) || 0,
      }),
    ),
  );
}

export async function criarProfissional(f: FormData) {
  await fazer((s) => dados(s.from('profissionais').insert({ salao_id: texto(f, 'salao_id'), nome: texto(f, 'nome') })));
}

export async function criarHorario(f: FormData) {
  const dias = f.getAll('dia_semana').map(Number);
  await fazer((s) =>
    dados(
      s.from('horarios').insert(
        dias.map((dia_semana) => ({
          profissional_id: texto(f, 'profissional_id'),
          dia_semana,
          abre: texto(f, 'abre'),
          fecha: texto(f, 'fecha'),
        })),
      ),
    ),
  );
}

export async function mudarStatus(f: FormData) {
  await fazer(
    (s) => dados(s.from('agendamentos').update({ status: texto(f, 'status') }).eq('id', texto(f, 'id'))),
    `/painel?dia=${texto(f, 'dia')}`,
  );
}

/** Apaga o agendamento e, com ele, o nome e o telefone do cliente. */
export async function apagarAgendamento(f: FormData) {
  await fazer((s) => dados(s.from('agendamentos').delete().eq('id', texto(f, 'id'))), `/painel?dia=${texto(f, 'dia')}`);
}

export async function apagarItem(f: FormData) {
  const tabela = texto(f, 'tabela');
  if (!['servicos', 'profissionais', 'horarios'].includes(tabela)) return;
  await fazer((s) => dados(s.from(tabela).delete().eq('id', texto(f, 'id'))));
}
