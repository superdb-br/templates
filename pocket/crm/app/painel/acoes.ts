'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { exigirSessao, dados } from '../_componentes/sessao';
import { mensagemDe } from '@/lib/superdb/erros';

const texto = (f: FormData, k: string) => String(f.get(k) ?? '').trim();
const ouNulo = (f: FormData, k: string) => texto(f, k) || null;

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

export async function criarEmpresa(f: FormData) {
  await fazer((s) => dados(s.from('empresas').insert({ nome: texto(f, 'nome'), site: ouNulo(f, 'site') })));
}

export async function criarContato(f: FormData) {
  await fazer((s) =>
    dados(s.from('contatos').insert({ nome: texto(f, 'nome'), email: ouNulo(f, 'email'), telefone: ouNulo(f, 'telefone'), empresa_id: ouNulo(f, 'empresa_id') })),
  );
}

export async function criarNegocio(f: FormData) {
  await fazer((s) =>
    dados(
      s.from('negocios').insert({
        titulo: texto(f, 'titulo'),
        valor_centavos: Math.round(Number(texto(f, 'valor').replace(/\./g, '').replace(',', '.')) * 100) || 0,
        etapa_id: texto(f, 'etapa_id'),
        contato_id: ouNulo(f, 'contato_id'),
      }),
    ),
  );
}

export async function moverNegocio(f: FormData) {
  await fazer((s) => dados(s.from('negocios').update({ etapa_id: texto(f, 'etapa_id'), atualizado_em: new Date().toISOString() }).eq('id', texto(f, 'id'))));
}

export async function criarAtividade(f: FormData) {
  const lembrar = texto(f, 'lembrar_em');
  await fazer((s) =>
    dados(
      s.from('atividades').insert({
        negocio_id: ouNulo(f, 'negocio_id'),
        tipo: texto(f, 'tipo'),
        descricao: texto(f, 'descricao'),
        lembrar_em: lembrar ? `${lembrar}:00-03:00` : null,
      }),
    ),
  );
}

export async function concluirAtividade(f: FormData) {
  await fazer((s) => dados(s.from('atividades').update({ feita: true }).eq('id', texto(f, 'id'))));
}
