// Versão JavaScript, gerada a partir do TypeScript que os outros templates usam.
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
import { createClient } from '@superdb/client';
import { traduzirErroDeLogin } from './erros.js';
// A chave em que o SDK guarda a sessão. Lida aqui só para saber o que OUTRA aba gravou.
const CHAVE_DA_SESSAO = 'superdb.auth.session';
// Renova quando falta menos que isto para vencer, para a consulta chegar com folga.
const MARGEM_MS = 60_000;
const TRAVA_ENTRE_ABAS = 'superdb:renovar-sessao';
export function criarSuperDB(config) {
  const armazenamento = config.armazenamento ?? armazenamentoPadrao();
  const ouvintes = new Set();
  let renovacaoEmCurso = null;
  // A renovação é DESTE arquivo (trava entre abas, aviso de saída às outras
  // abas). Desde a 0.3 o SDK também renova sozinho; os dois juntos fariam o
  // SDK deslogar sem este arquivo avisar ninguém. `autoRefreshToken: false`
  // devolve o controle para cá. Vai em spread para compilar também contra a
  // 0.2, que não conhece a opção (e a ignora).
  const semRenovacaoDoSdk = { autoRefreshToken: false };
  const superdb = createClient(config.url, config.anonKey, {
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
  function avisar(s) {
    for (const ouvinte of ouvintes)
      ouvinte(s);
  }
  async function sessaoEmMemoria() {
    return (await superdb.auth.getSession()).data.session;
  }
  async function lerSessaoGravada() {
    const bruto = await armazenamento.getItem(CHAVE_DA_SESSAO);
    if (!bruto)
      return null;
    try {
      return JSON.parse(bruto);
    }
    catch {
      return null;
    }
  }
  // Assume uma sessão que outra aba gravou. O SDK recalcula o vencimento a
  // partir de `expires_in`, então vai o tempo que SOBROU, não 1 hora cheia.
  async function adotar(gravada) {
    await superdb.auth.setSession({
      access_token: gravada.access_token,
      refresh_token: gravada.refresh_token,
      data_plane_token: gravada.data_plane_token,
      expires_in: Math.floor((gravada.expires_at - Date.now()) / 1000),
    });
  }
  async function renovar() {
    const passo = async () => {
      const emMemoria = await sessaoEmMemoria();
      const gravada = await lerSessaoGravada();
      if (!gravada) {
        // Outra aba saiu (ou o armazenamento foi limpo): esta aba sai junto.
        if (emMemoria)
          await superdb.auth.signOut().catch(() => undefined);
        avisar(null);
        return null;
      }
      if (emMemoria && gravada.refresh_token !== emMemoria.refresh_token) {
        // Outra aba renovou enquanto esta esperava a vez. O refresh token desta
        // aba já foi trocado e usá-lo agora derrubaria a sessão: adota o da outra.
        await adotar(gravada);
        if (emDia(gravada))
          return sessaoEmMemoria();
      }
      else if (emMemoria && emDia(emMemoria)) {
        return emMemoria;
      }
      const { data, error } = await superdb.auth.refreshSession();
      const nova = error ? null : data.session;
      avisar(nova);
      return nova;
    };
    const travas = globalThis.navigator?.locks;
    return travas ? travas.request(TRAVA_ENTRE_ABAS, passo) : passo();
  }
  /** A sessão atual, renovada se estiver perto de vencer. `null` = ninguém logado. */
  async function sessao() {
    const atual = await sessaoEmMemoria();
    if (!atual || emDia(atual))
      return atual;
    renovacaoEmCurso ??= renovar().finally(() => {
      renovacaoEmCurso = null;
    });
    return renovacaoEmCurso;
  }
  async function entrar(email, senha) {
    const { data, error } = await superdb.auth.signInWithPassword({ email: email.trim(), password: senha });
    if (error)
      throw traduzirErroDeLogin(error);
    avisar(data.session);
    return data.session;
  }
  async function criarConta(email, senha) {
    const { data, error } = await superdb.auth.signUp({ email: email.trim(), password: senha });
    if (error)
      throw traduzirErroDeLogin(error);
    avisar(data.session);
    return data.session;
  }
  async function sair() {
    // Com o token em dia, a saída encerra a sessão também no servidor, e não só aqui.
    await sessao().catch(() => null);
    await superdb.auth.signOut().catch(() => undefined);
    avisar(null);
  }
  /** Avisa a cada login, saída ou renovação, inclusive vindos de outra aba. */
  function aoMudar(ouvinte) {
    ouvintes.add(ouvinte);
    return () => {
      ouvintes.delete(ouvinte);
    };
  }
  // Login e saída em outra aba chegam pelo evento `storage` do navegador. A
  // renovação feita por outra aba é adotada só quando esta precisar renovar.
  const ouvirEventos = globalThis
    .addEventListener;
  if (typeof ouvirEventos === 'function') {
    ouvirEventos.call(globalThis, 'storage', (evento) => {
      if (evento.key !== CHAVE_DA_SESSAO && evento.key !== null)
        return;
      if (!evento.newValue) {
        void sessaoEmMemoria().then(async (s) => {
          if (!s)
            return;
          await superdb.auth.signOut().catch(() => undefined);
          avisar(null);
        });
      }
      else if (!evento.oldValue) {
        const gravada = JSON.parse(evento.newValue);
        void adotar(gravada).then(sessaoEmMemoria).then(avisar);
      }
    });
  }
  return { superdb, sessao, entrar, criarConta, sair, aoMudar };
}
function emDia(s) {
  return s.expires_at - Date.now() > MARGEM_MS;
}
/** Quem está logado. Vem do token de dados quando o SDK não trouxe o usuário. */
export function usuarioDa(sessao) {
  if (!sessao)
    return null;
  const claims = lerClaims(sessao.data_plane_token);
  return {
    id: sessao.user?.id ?? String(claims.sub ?? ''),
    email: sessao.user?.email ?? (typeof claims.email === 'string' ? claims.email : null),
  };
}
function lerClaims(token) {
  const parte = token?.split('.')[1];
  if (!parte)
    return {};
  try {
    const base64 = parte.replace(/-/g, '+').replace(/_/g, '/');
    const binario = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
    const bytes = Uint8Array.from(binario, (c) => c.charCodeAt(0));
    const texto = typeof TextDecoder === 'function' ? new TextDecoder().decode(bytes) : binario;
    return JSON.parse(texto);
  }
  catch {
    return {};
  }
}
function armazenamentoPadrao() {
  try {
    const local = globalThis.localStorage;
    if (local) {
      local.getItem(CHAVE_DA_SESSAO);
      return local;
    }
  }
  catch {
    // Sem localStorage (servidor, ou navegador bloqueando): a sessão vive só na memória.
  }
  const memoria = new Map();
  return {
    getItem: (chave) => memoria.get(chave) ?? null,
    setItem: (chave, valor) => void memoria.set(chave, valor),
    removeItem: (chave) => void memoria.delete(chave),
  };
}
