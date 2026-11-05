// A NFS-e da ordem, emitida pelo SuperDB Fiscal. SÓ NO SERVIDOR.
//
// Emitir nota é ato fiscal no CNPJ da loja: só a chave de serviço
// (SUPERDB_SERVICE_ROLE_KEY) emite, e ela nunca vai ao navegador. Por isso este
// arquivo importa 'server-only' e a variável NÃO tem o prefixo NEXT_PUBLIC_.
//
// Quem pede a nota é alguém da equipe, logado: a ordem é lida com a sessão DELA
// (o RLS confere que é da equipe) e só então a chave de serviço emite. A
// `ref` é o número da ordem: pedir de novo devolve a mesma nota, sem duplicar.
//
// A nota é do SERVIÇO (mão de obra). Peça vendida é mercadoria (NF-e, ICMS):
// o SuperDB não emite NF-e.
//
// Abaixo do plano Pro, a Fiscal emite em homologação: nota de teste, sem valor
// fiscal. O `ambiente` da nota diz qual foi, e a tela mostra.

import 'server-only';
import { createClient, type SupabaseClient } from '@superdb/client';
import { config } from '@/lib/superdb/config';

const CHAVE_DE_SERVICO = process.env.SUPERDB_SERVICE_ROLE_KEY ?? '';

/** A emissão está ligada neste deploy? Sem a chave, a tela explica como ligar. */
export const fiscalConfigurada = Boolean(CHAVE_DE_SERVICO);

function clienteDeServico() {
  return createClient(config.url, CHAVE_DE_SERVICO, { project: config.projeto, autoRefreshToken: false });
}

type OrdemParaNota = {
  id: string;
  numero: number;
  status: string;
  total_servicos_centavos: number;
  nfse_id: string | null;
  clientes: { nome: string; documento: string | null; email: string | null; endereco: Record<string, string> | null } | null;
};

export type ResultadoDaNota =
  | { ok: true; situacao: string; ambiente: 'homologacao' | 'producao' | null; numero: string | null }
  | { ok: false; mensagem: string };

const SEM_CHAVE =
  'A emissão de nota não está ligada neste app: defina SUPERDB_SERVICE_ROLE_KEY nas variáveis do servidor (na Vercel, Environment Variables) e ative o SuperDB Fiscal no painel do projeto.';

async function gravarNota(admin: SupabaseClient, ordemId: string, nota: { id: string; situacao: string; ambiente: 'homologacao' | 'producao' | null; numero: string | null }) {
  await admin
    .from('ordens_servico')
    .update({ nfse_id: nota.id, nfse_situacao: nota.situacao, nfse_ambiente: nota.ambiente, nfse_numero: nota.numero })
    .eq('id', ordemId);
}

/**
 * Emite (ou consulta, se já pedida) a NFS-e da ordem. `sessao` é o cliente da
 * pessoa logada: se o RLS não deixar ela ler a ordem, nada é emitido.
 */
export async function notaDaOrdem(sessao: SupabaseClient, ordemId: string): Promise<ResultadoDaNota> {
  if (!fiscalConfigurada) return { ok: false, mensagem: SEM_CHAVE };
  const { data, error } = await sessao
    .from('ordens_servico')
    .select('id, numero, status, total_servicos_centavos, nfse_id, clientes(nome, documento, email, endereco)')
    .eq('id', ordemId)
    .single();
  if (error || !data) return { ok: false, mensagem: 'Ordem não encontrada para a sua conta.' };
  const o = data as unknown as OrdemParaNota;
  if (o.status !== 'entregue') return { ok: false, mensagem: 'A nota sai depois da entrega.' };
  if (Number(o.total_servicos_centavos) <= 0) {
    return { ok: false, mensagem: 'Esta ordem não tem serviço (só peça): não há mão de obra para a NFS-e.' };
  }

  const admin = clienteDeServico();
  if (o.nfse_id) {
    const { data: nota, error: e } = await admin.fiscal.nfse.consultar(o.nfse_id);
    if (e || !nota) return { ok: false, mensagem: e?.message ?? 'Não deu para consultar a nota agora.' };
    await gravarNota(admin, o.id, nota);
    return { ok: true, situacao: nota.situacao, ambiente: nota.ambiente, numero: nota.numero };
  }

  const doc = o.clientes?.documento ?? null;
  const endereco = o.clientes?.endereco;
  const { data: nota, error: e } = await admin.fiscal.nfse.emitir({
    ref: `os-${o.numero}`,
    tomador: {
      ...(doc?.length === 14 ? { cnpj: doc } : doc ? { cpf: doc } : {}),
      nome: o.clientes?.nome ?? 'Consumidor',
      ...(o.clientes?.email ? { email: o.clientes.email } : {}),
      // Obrigatório em homologação e, a partir de 01/01/2027, em produção (IBS e CBS).
      ...(endereco
        ? {
            endereco: {
              logradouro: endereco.logradouro ?? '',
              numero: endereco.numero ?? '',
              bairro: endereco.bairro ?? '',
              codigo_municipio: endereco.codigo_municipio ?? '',
              cep: endereco.cep ?? '',
            },
          }
        : {}),
    },
    servico: {
      valor: Number(o.total_servicos_centavos) / 100,
      informacoes_complementares: `Ordem de serviço ${o.numero}`,
    },
  });
  if (e || !nota) {
    if (e?.code === 'tomador_sem_endereco') {
      return { ok: false, mensagem: 'A nota pede o CPF ou CNPJ e o endereço completo do cliente. Complete o cadastro do cliente e tente de novo.' };
    }
    return { ok: false, mensagem: e?.message ?? 'Não deu para emitir a nota agora. Tente de novo: a mesma ordem nunca gera duas notas.' };
  }
  await gravarNota(admin, o.id, nota);
  return { ok: true, situacao: nota.situacao, ambiente: nota.ambiente, numero: nota.numero };
}
