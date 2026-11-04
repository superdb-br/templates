// O cliente do SuperDB com a sessão sempre em dia, para apps que rodam no
// navegador ou no celular.
//
// POR QUE ESTE ARQUIVO EXISTE
//
// O login do SuperDB entrega um token que vale 1 hora. O SDK (@superdb/client)
// guarda a sessão, mas não a renova sozinho: passada a hora, toda consulta volta
// 401 e o app parece quebrado. Aqui a renovação acontece um pouco antes de o
// token vencer, no instante em que uma consulta precisa dele. O resto do app usa
// `superdb.from(...)` normalmente e nunca pensa nisso.
//
// A ARMADILHA DAS DUAS ABAS
//
// A cada renovação o SuperDB troca o refresh token, e usar um refresh token já
// trocado é tratado como roubo: a sessão inteira é encerrada. Duas abas do app
// renovando ao mesmo tempo com o mesmo token derrubariam o login das duas. Por
// isso a renovação é uma de cada vez: dentro da aba (uma promessa compartilhada)
// e entre abas (Web Locks), relendo antes o que a outra aba já gravou.

import { createClient, type Session, type SupabaseClient } from '@superdb/client';
import { traduzirErroDeLogin } from './erros';

export type Armazenamento = {
  getItem(chave: string): string | null | Promise<string | null>;
  setItem(chave: string, valor: string): void | Promise<void>;
  removeItem(chave: string): void | Promise<void>;
};

export type ConfigSuperDB = {
  /** URL de auth do seu SuperDB, a mesma do painel: https://auth.superdb.com.br */
  url: string;
  /** Chave anon do projeto. É pública: pode ir no código do app. */
  anonKey: string;
  /** Slug do projeto. É ele que aponta as consultas para as SUAS tabelas. */
  projeto: string;
  /** Onde guardar a sessão. Padrão: localStorage. No celular, AsyncStorage. */
  armazenamento?: Armazenamento;
  /** Só para testes e ambientes sem `fetch` global. */
  fetch?: typeof fetch;
};

export type Usuario = { id: string; email: string | null };

type Travas = { request<T>(nome: string, tarefa: () => Promise<T>): Promise<T> };
type EventoDeArmazenamento = { key: string | null; oldValue: string | null; newValue: string | null };

// A chave em que o SDK guarda a sessão. Lida aqui só para saber o que OUTRA aba gravou.
const CHAVE_DA_SESSAO = 'superdb.auth.session';
// Renova quando falta menos que isto para vencer, para a consulta chegar com folga.
const MARGEM_MS = 60_000;
const TRAVA_ENTRE_ABAS = 'superdb:renovar-sessao';

export function criarSuperDB(config: ConfigSuperDB) {
  const armazenamento = config.armazenamento ?? armazenamentoPadrao();
  const ouvintes = new Set<(sessao: Session | null) => void>();
  let renovacaoEmCurso: Promise<Session | null> | null = null;

  // A renovação é DESTE arquivo (trava entre abas, aviso de saída às outras
  // abas). Desde a 0.3 o SDK também renova sozinho; os dois juntos fariam o
  // SDK deslogar sem este arquivo avisar ninguém. `autoRefreshToken: false`
  // devolve o controle para cá. Vai em spread para compilar também contra a
  // 0.2, que não conhece a opção (e a ignora).
  const semRenovacaoDoSdk = { autoRefreshToken: false };
  const superdb: SupabaseClient = createClient(config.url, config.anonKey, {
    project: config.projeto,
    storage: armazenamento,
    fetch: config.fetch,
    ...semRenovacaoDoSdk,
  });

  // O SDK pede o token de dados a este método antes de CADA consulta (e antes de
  // cada operação de storage). Trocá-lo por uma versão que renova antes de
  // entregar põe todas as consultas em dia sem mexer em nada do resto do app.
  // Sem rede para renovar agora, a consulta segue com o token atual e o erro
  // dela, já traduzido, é o que aparece na tela.
  const tokenDeDados = superdb.auth.getDataPlaneToken.bind(superdb.auth);
  superdb.auth.getDataPlaneToken = async () => {
    await sessao().catch(() => null);
    return tokenDeDados();
  };

  function avisar(s: Session | null) {
    for (const ouvinte of ouvintes) ouvinte(s);
  }

  async function sessaoEmMemoria(): Promise<Session | null> {
    return (await superdb.auth.getSession()).data.session;
  }

  async function lerSessaoGravada(): Promise<Session | null> {
    const bruto = await armazenamento.getItem(CHAVE_DA_SESSAO);
    if (!bruto) return null;
    try {
      return JSON.parse(bruto) as Session;
    } catch {
      return null;
    }
  }

  // Assume uma sessão que outra aba gravou. O SDK recalcula o vencimento a
  // partir de `expires_in`, então vai o tempo que SOBROU, não 1 hora cheia.
  async function adotar(gravada: Session) {
    await superdb.auth.setSession({
      access_token: gravada.access_token,
      refresh_token: gravada.refresh_token,
      data_plane_token: gravada.data_plane_token,
      expires_in: Math.floor((gravada.expires_at - Date.now()) / 1000),
    });
  }

  async function renovar(): Promise<Session | null> {
    const passo = async (): Promise<Session | null> => {
      const emMemoria = await sessaoEmMemoria();
      const gravada = await lerSessaoGravada();

      if (!gravada) {
        // Outra aba saiu (ou o armazenamento foi limpo): esta aba sai junto.
        if (emMemoria) await superdb.auth.signOut().catch(() => undefined);
        avisar(null);
        return null;
      }
      if (emMemoria && gravada.refresh_token !== emMemoria.refresh_token) {
        // Outra aba renovou enquanto esta esperava a vez. O refresh token desta
        // aba já foi trocado e usá-lo agora derrubaria a sessão: adota o da outra.
        await adotar(gravada);
        if (emDia(gravada)) return sessaoEmMemoria();
      } else if (emMemoria && emDia(emMemoria)) {
        return emMemoria;
      }

      const { data, error } = await superdb.auth.refreshSession();
      const nova = error ? null : data.session;
      avisar(nova);
      return nova;
    };

    const travas = (globalThis as { navigator?: { locks?: Travas } }).navigator?.locks;
    return travas ? travas.request(TRAVA_ENTRE_ABAS, passo) : passo();
  }

  /** A sessão atual, renovada se estiver perto de vencer. `null` = ninguém logado. */
  async function sessao(): Promise<Session | null> {
    const atual = await sessaoEmMemoria();
    if (!atual || emDia(atual)) return atual;
    renovacaoEmCurso ??= renovar().finally(() => {
      renovacaoEmCurso = null;
    });
    return renovacaoEmCurso;
  }

  async function entrar(email: string, senha: string): Promise<Session> {
    const { data, error } = await superdb.auth.signInWithPassword({ email: email.trim(), password: senha });
    if (error) throw traduzirErroDeLogin(error);
    avisar(data.session);
    return data.session;
  }

  async function criarConta(email: string, senha: string): Promise<Session> {
    const { data, error } = await superdb.auth.signUp({ email: email.trim(), password: senha });
    if (error) throw traduzirErroDeLogin(error);
    avisar(data.session);
    return data.session;
  }

  async function sair(): Promise<void> {
    // Com o token em dia, a saída encerra a sessão também no servidor, e não só aqui.
    await sessao().catch(() => null);
    await superdb.auth.signOut().catch(() => undefined);
    avisar(null);
  }

  /** Avisa a cada login, saída ou renovação, inclusive vindos de outra aba. */
  function aoMudar(ouvinte: (sessao: Session | null) => void): () => void {
    ouvintes.add(ouvinte);
    return () => {
      ouvintes.delete(ouvinte);
    };
  }

  // Login e saída em outra aba chegam pelo evento `storage` do navegador. A
  // renovação feita por outra aba é adotada só quando esta precisar renovar.
  const ouvirEventos = (globalThis as { addEventListener?: (tipo: string, fn: (e: EventoDeArmazenamento) => void) => void })
    .addEventListener;
  if (typeof ouvirEventos === 'function') {
    ouvirEventos.call(globalThis, 'storage', (evento) => {
      if (evento.key !== CHAVE_DA_SESSAO && evento.key !== null) return;
      if (!evento.newValue) {
        void sessaoEmMemoria().then(async (s) => {
          if (!s) return;
          await superdb.auth.signOut().catch(() => undefined);
          avisar(null);
        });
      } else if (!evento.oldValue) {
        const gravada = JSON.parse(evento.newValue) as Session;
        void adotar(gravada).then(sessaoEmMemoria).then(avisar);
      }
    });
  }

  return { superdb, sessao, entrar, criarConta, sair, aoMudar };
}

export type SuperDB = ReturnType<typeof criarSuperDB>;

function emDia(s: Session): boolean {
  return s.expires_at - Date.now() > MARGEM_MS;
}

/** Quem está logado. Vem do token de dados quando o SDK não trouxe o usuário. */
export function usuarioDa(sessao: Session | null): Usuario | null {
  if (!sessao) return null;
  const claims = lerClaims(sessao.data_plane_token);
  return {
    id: sessao.user?.id ?? String(claims.sub ?? ''),
    email: sessao.user?.email ?? (typeof claims.email === 'string' ? claims.email : null),
  };
}

function lerClaims(token?: string | null): Record<string, unknown> {
  const parte = token?.split('.')[1];
  if (!parte) return {};
  try {
    const base64 = parte.replace(/-/g, '+').replace(/_/g, '/');
    const binario = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
    const bytes = Uint8Array.from(binario, (c) => c.charCodeAt(0));
    const texto = typeof TextDecoder === 'function' ? new TextDecoder().decode(bytes) : binario;
    return JSON.parse(texto) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function armazenamentoPadrao(): Armazenamento {
  try {
    const local = (globalThis as { localStorage?: Armazenamento }).localStorage;
    if (local) {
      local.getItem(CHAVE_DA_SESSAO);
      return local;
    }
  } catch {
    // Sem localStorage (servidor, ou navegador bloqueando): a sessão vive só na memória.
  }
  const memoria = new Map<string, string>();
  return {
    getItem: (chave) => memoria.get(chave) ?? null,
    setItem: (chave, valor) => void memoria.set(chave, valor),
    removeItem: (chave) => void memoria.delete(chave),
  };
}
