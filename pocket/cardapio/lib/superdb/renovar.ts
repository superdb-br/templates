// Renova a sessão antes que ela vença. Chamado pelo proxy.ts em toda navegação
// e Server Action, porque é ali (e não numa página) que dá para regravar cookies.
//
// A ARMADILHA: o SuperDB troca o refresh token a cada renovação e trata o uso de
// um refresh token já trocado como roubo, encerrando a sessão. Uma página do
// Next dispara várias requisições quase juntas (a página, os prefetches dos
// links, uma Server Action), todas com o MESMO cookie. Se cada uma renovasse por
// conta própria, a segunda derrubaria a sessão da pessoa.
//
// Por isso, dentro deste servidor:
//   - a renovação de um refresh token acontece uma vez só, e as requisições
//     simultâneas esperam por ela;
//   - por 30 segundos, quem chegar com o token antigo (porque o navegador ainda
//     não tinha recebido o cookie novo) recebe a sessão já renovada.
//
// Se o app rodar em várias instâncias ao mesmo tempo (serverless), cada uma tem
// a sua memória; a janela de risco é pequena, mas existe. Ver o README.

import { NextResponse, type NextRequest } from 'next/server';
import { createClient, type Session } from '@superdb/client';
import { config } from './config';
import { COOKIES, OPCOES_DO_COOKIE, gravarSessao, sessaoDosCookies } from './cookies';

// Renova quando falta menos que isto para vencer.
const MARGEM_MS = 60_000;
// Por quanto tempo o resultado de uma renovação vale para quem chegar atrasado.
const JANELA_MS = 30_000;

type Resultado = { sessao: Session } | { encerrada: true } | { adiada: true };

const emAndamento = new Map<string, Promise<Resultado>>();
const recentes = new Map<string, { resultado: Resultado; ate: number }>();

export async function renovarSessao(request: NextRequest): Promise<NextResponse> {
  const atual = sessaoDosCookies({ ler: (nome) => request.cookies.get(nome)?.value });
  if (!atual || atual.expires_at - Date.now() > MARGEM_MS) return NextResponse.next();

  const resultado = await renovarUmaVez(atual.refresh_token);
  // Sem rede ou SuperDB fora do ar agora: segue com a sessão atual e tenta na próxima.
  if ('adiada' in resultado) return NextResponse.next();

  const novos = new Map<string, string | null>();
  if ('sessao' in resultado) gravarSessao({ gravar: (nome, valor) => novos.set(nome, valor) }, resultado.sessao);
  else for (const nome of Object.values(COOKIES)) novos.set(nome, null);

  // Na requisição, para a página DESTA requisição já ler o token novo...
  for (const [nome, valor] of novos) {
    if (valor) request.cookies.set(nome, valor);
    else request.cookies.delete(nome);
  }
  const resposta = NextResponse.next({ request });
  // ...e na resposta, para o navegador guardar.
  for (const [nome, valor] of novos) {
    if (valor) resposta.cookies.set(nome, valor, OPCOES_DO_COOKIE);
    else resposta.cookies.delete(nome);
  }
  return resposta;
}

function renovarUmaVez(refreshToken: string): Promise<Resultado> {
  const agora = Date.now();
  for (const [token, r] of recentes) if (r.ate < agora) recentes.delete(token);

  const recente = recentes.get(refreshToken);
  if (recente) return Promise.resolve(recente.resultado);

  let promessa = emAndamento.get(refreshToken);
  if (!promessa) {
    promessa = chamarRenovacao(refreshToken)
      .then((resultado) => {
        if (!('adiada' in resultado)) recentes.set(refreshToken, { resultado, ate: Date.now() + JANELA_MS });
        return resultado;
      })
      .finally(() => emAndamento.delete(refreshToken));
    emAndamento.set(refreshToken, promessa);
  }
  return promessa;
}

async function chamarRenovacao(refreshToken: string): Promise<Resultado> {
  // Um cliente descartável, com a sessão só na memória: para renovar, basta o refresh token.
  const memoria = new Map<string, string>([
    ['superdb.auth.session', JSON.stringify({ refresh_token: refreshToken, access_token: '', expires_at: 0 })],
  ]);
  // A renovação é a chamada explícita abaixo, uma por refresh token; o SDK não
  // renova por conta própria aqui (em spread: compila também contra a 0.2).
  const semRenovacaoDoSdk = { autoRefreshToken: false };
  const superdb = createClient(config.url, config.anonKey, {
    project: config.projeto,
    storage: {
      getItem: (chave) => memoria.get(chave) ?? null,
      setItem: (chave, valor) => void memoria.set(chave, valor),
      removeItem: (chave) => void memoria.delete(chave),
    },
    ...semRenovacaoDoSdk,
  });
  try {
    const { data, error } = await superdb.auth.refreshSession();
    if (data) return { sessao: data.session };
    // 400/401: a sessão acabou (reusada, revogada, conta apagada). 429/5xx: tenta depois.
    const definitivo = error.status !== undefined && error.status < 500 && error.status !== 429;
    return definitivo ? { encerrada: true } : { adiada: true };
  } catch {
    return { adiada: true };
  }
}
