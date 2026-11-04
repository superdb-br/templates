// A sessão do SuperDB guardada em cookies httpOnly, e não no localStorage.
//
// POR QUE COOKIES
// No Next, quem busca os dados é o servidor (Server Components e Server
// Actions). O servidor não enxerga o localStorage do navegador, mas recebe os
// cookies em toda requisição. E, sendo httpOnly, nenhum JavaScript da página
// (nem um script injetado por alguém) consegue ler os tokens.
//
// POR QUE QUATRO COOKIES, E NÃO UM
// A sessão inteira em JSON passaria de 4 KB, o limite de um cookie. Separado,
// cada token cabe com folga. O usuário não vai em cookie: quem ele é sai do
// próprio token de dados.

import type { Session } from '@superdb/client';

export const COOKIES = {
  acesso: 'sdb-acesso',
  renovacao: 'sdb-renovacao',
  dados: 'sdb-dados',
  vence: 'sdb-vence',
} as const;

// A chave com que o SDK pede e grava a sessão no armazenamento.
const CHAVE_DA_SESSAO = 'superdb.auth.session';

export const OPCOES_DO_COOKIE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  // O mesmo prazo do refresh token (30 dias). Quem decide se a sessão ainda
  // vale é o SuperDB; o cookie só precisa durar até lá.
  maxAge: 60 * 60 * 24 * 30,
};

/** Onde os cookies são lidos e gravados: muda entre proxy, Server Action e página. */
export type Pote = {
  ler(nome: string): string | undefined;
  gravar(nome: string, valor: string): void;
  apagar(nome: string): void;
};

/** O armazenamento que o SDK espera (getItem/setItem/removeItem), feito de cookies. */
export function armazenamentoEmCookies(pote: Pote) {
  return {
    getItem(chave: string): string | null {
      if (chave !== CHAVE_DA_SESSAO) return null;
      const sessao = sessaoDosCookies(pote);
      return sessao ? JSON.stringify(sessao) : null;
    },
    setItem(chave: string, valor: string) {
      if (chave === CHAVE_DA_SESSAO) gravarSessao(pote, JSON.parse(valor) as Session);
    },
    removeItem(chave: string) {
      if (chave === CHAVE_DA_SESSAO) for (const nome of Object.values(COOKIES)) pote.apagar(nome);
    },
  };
}

export function gravarSessao(pote: Pick<Pote, 'gravar'>, sessao: Session) {
  pote.gravar(COOKIES.acesso, sessao.access_token);
  pote.gravar(COOKIES.renovacao, sessao.refresh_token);
  pote.gravar(COOKIES.dados, sessao.data_plane_token ?? '');
  pote.gravar(COOKIES.vence, String(sessao.expires_at));
}

export function sessaoDosCookies(pote: Pick<Pote, 'ler'>): Session | null {
  const acesso = pote.ler(COOKIES.acesso);
  const renovacao = pote.ler(COOKIES.renovacao);
  if (!acesso || !renovacao) return null;
  const dados = pote.ler(COOKIES.dados) || null;
  const vence = Number(pote.ler(COOKIES.vence)) || 0;
  const claims = lerClaims(dados);
  return {
    access_token: acesso,
    refresh_token: renovacao,
    data_plane_token: dados,
    expires_at: vence,
    expires_in: Math.max(0, Math.round((vence - Date.now()) / 1000)),
    token_type: 'bearer',
    user: { id: String(claims.sub ?? ''), email: typeof claims.email === 'string' ? claims.email : null },
  };
}

function lerClaims(token: string | null): Record<string, unknown> {
  const parte = token?.split('.')[1];
  if (!parte) return {};
  try {
    return JSON.parse(Buffer.from(parte, 'base64url').toString('utf8')) as Record<string, unknown>;
  } catch {
    return {};
  }
}
