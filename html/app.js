// O app inteiro, sem framework: três telas (configuração, login, tarefas)
// montadas com DOM puro.
//
// Todo texto que veio de fora (título de tarefa, e-mail, mensagem de erro) entra
// com `textContent`, nunca com innerHTML. É o que impede alguém de cadastrar uma
// tarefa chamada <img onerror=...> e rodar código no navegador de quem abrir.

import { config } from './config.js';
import { criarSuperDB, usuarioDa } from './js/superdb/sessao.js';
import { ErroSuperDB, mensagemDe } from './js/superdb/erros.js';
import { TITULO_MAX, alternarTarefa, apagarTarefa, criarTarefa, listarTarefas } from './js/superdb/tarefas.js';
import { diagnosticar } from './js/superdb/diagnostico.js';

const NOMES = { url: 'config.url', anonKey: 'config.anonKey', projeto: 'config.projeto' };
const configurado = Boolean(config.url && config.anonKey && config.projeto);
const emDesenvolvimento = ['localhost', '127.0.0.1'].includes(location.hostname);
const app = criarSuperDB(config);
const superdb = app.superdb;

const tela = document.getElementById('tela');

/** Cria um elemento. Filhos em texto viram nós de texto (seguros). */
function el(tag, atributos = {}, ...filhos) {
  const no = document.createElement(tag);
  for (const [nome, valor] of Object.entries(atributos)) {
    if (nome.startsWith('on')) no.addEventListener(nome.slice(2), valor);
    else if (valor === true) no.setAttribute(nome, '');
    else if (valor !== false && valor != null) no.setAttribute(nome, String(valor));
  }
  for (const filho of filhos.flat()) {
    if (filho == null || filho === false) continue;
    no.append(filho instanceof Node ? filho : document.createTextNode(String(filho)));
  }
  return no;
}

function mostrar(...conteudo) {
  tela.replaceChildren(...conteudo);
}

// ── Cabeçalho ────────────────────────────────────────────────

function atualizarCabecalho(sessao) {
  const usuario = usuarioDa(sessao);
  document.getElementById('quem').hidden = !usuario;
  document.getElementById('quem-email').textContent = usuario?.email ?? '';
}

document.getElementById('sair').addEventListener('click', () => void app.sair());

// ── Diagnóstico ──────────────────────────────────────────────

const ICONE = { ok: '✓', falta: '✕', aviso: '!' };

function telaDiagnostico() {
  const corpo = el('div', { class: 'carregando' }, 'Conferindo…');
  const cartao = el(
    'section',
    { class: 'cartao', 'aria-labelledby': 'titulo-conexao' },
    el('h2', { id: 'titulo-conexao', class: 'titulo-secao' }, 'Conexão com o SuperDB'),
    corpo,
  );

  async function conferir() {
    corpo.replaceChildren(el('div', { class: 'carregando' }, 'Conferindo…'));
    const passos = await diagnosticar(config, NOMES);
    const lista = el(
      'ul',
      { class: 'passos' },
      passos.map((p) =>
        el(
          'li',
          { class: 'passo', 'data-estado': p.estado },
          el('span', { class: 'passo-icone', 'aria-hidden': 'true' }, ICONE[p.estado]),
          el('div', {}, el('strong', {}, p.titulo), el('p', {}, p.detalhe)),
        ),
      ),
    );
    const faltaVariavel = passos[0]?.estado === 'falta';
    const faltaAlgo = passos.some((p) => p.estado !== 'ok');
    corpo.replaceChildren(
      lista,
      faltaVariavel &&
        el('pre', { class: 'codigo' }, `// config.js\nurl: 'https://auth.superdb.com.br',\nanonKey: 'cole-a-chave-anon-aqui',\nprojeto: 'slug-do-projeto',`),
      faltaAlgo &&
        el('div', { class: 'acoes' }, el('button', { class: 'botao botao-secundario botao-pequeno', onclick: conferir }, 'Conferir de novo')),
    );
  }

  void conferir();
  return cartao;
}

// ── Login ────────────────────────────────────────────────────

function telaEntrar() {
  let modo = 'entrar';
  const titulo = el('h1', { id: 'titulo-entrar', class: 'titulo' });
  const dica = el('span', { id: 'dica-senha', class: 'dica' }, 'Pelo menos 8 caracteres.');
  const email = el('input', { class: 'entrada', type: 'email', autocomplete: 'email', required: true });
  const senha = el('input', { id: 'senha', class: 'entrada', type: 'password', minlength: 8, required: true });
  const erro = el('p', { class: 'mensagem mensagem-erro', role: 'alert', hidden: true });
  const botao = el('button', { class: 'botao', type: 'submit' });
  const abaEntrar = el('button', { type: 'button', role: 'tab', class: 'aba', onclick: () => trocar('entrar') }, 'Entrar');
  const abaCriar = el('button', { type: 'button', role: 'tab', class: 'aba', onclick: () => trocar('criar') }, 'Criar conta');

  function trocar(novo) {
    modo = novo;
    titulo.textContent = modo === 'entrar' ? 'Entre para ver suas tarefas' : 'Crie sua conta';
    botao.textContent = modo === 'entrar' ? 'Entrar' : 'Criar conta';
    abaEntrar.setAttribute('aria-selected', String(modo === 'entrar'));
    abaCriar.setAttribute('aria-selected', String(modo === 'criar'));
    senha.autocomplete = modo === 'entrar' ? 'current-password' : 'new-password';
    dica.hidden = modo === 'entrar';
    if (modo === 'criar') senha.setAttribute('aria-describedby', 'dica-senha');
    else senha.removeAttribute('aria-describedby');
    erro.hidden = true;
  }

  async function enviar(evento) {
    evento.preventDefault();
    botao.disabled = true;
    botao.textContent = 'Um instante…';
    erro.hidden = true;
    try {
      // Deu certo: o aoMudar lá embaixo recebe a sessão e troca de tela.
      if (modo === 'entrar') await app.entrar(email.value, senha.value);
      else await app.criarConta(email.value, senha.value);
    } catch (falha) {
      erro.textContent = mensagemDe(falha);
      erro.hidden = false;
      botao.disabled = false;
      botao.textContent = modo === 'entrar' ? 'Entrar' : 'Criar conta';
    }
  }

  trocar('entrar');
  return el(
    'section',
    { class: 'cartao', 'aria-labelledby': 'titulo-entrar' },
    titulo,
    el('p', { class: 'subtitulo' }, 'Cada pessoa só enxerga as próprias tarefas.'),
    el('div', { class: 'abas', role: 'tablist', 'aria-label': 'Entrar ou criar conta' }, abaEntrar, abaCriar),
    el(
      'form',
      { class: 'formulario', onsubmit: enviar },
      el('label', { class: 'campo' }, el('span', { class: 'rotulo' }, 'E-mail'), email),
      el('div', { class: 'campo' }, el('label', { class: 'rotulo', for: 'senha' }, 'Senha'), senha, dica),
      erro,
      botao,
    ),
  );
}

// ── Tarefas ──────────────────────────────────────────────────

function telaTarefas() {
  let tarefas = null;
  const lista = el('div', {}, el('div', { class: 'carregando' }, 'Carregando tarefas…'));
  const erro = el('p', { class: 'mensagem mensagem-erro mensagem-solta', role: 'alert', hidden: true });
  const entrada = el('input', { id: 'nova', class: 'entrada', placeholder: 'O que precisa ser feito?', maxlength: TITULO_MAX });
  const adicionar = el('button', { class: 'botao', type: 'submit', disabled: true }, 'Adicionar');
  entrada.addEventListener('input', () => (adicionar.disabled = !entrada.value.trim()));
  const cartao = el(
    'section',
    { class: 'cartao', 'aria-labelledby': 'titulo-tarefas' },
    el('h1', { id: 'titulo-tarefas', class: 'titulo' }, 'Suas tarefas'),
    el('form', { class: 'nova-tarefa', onsubmit: criar }, el('label', { for: 'nova', class: 'sr-only' }, 'Nova tarefa'), entrada, adicionar),
    erro,
    lista,
  );

  function falhou(falha) {
    // Sessão encerrada (em outro lugar, ou expirada): volta para o login.
    if (falha instanceof ErroSuperDB && falha.codigo === 'sessao_expirada') return void app.sair();
    // Sem a tabela, a tela vira o passo que falta, e não um erro solto.
    if (falha instanceof ErroSuperDB && falha.codigo === 'tabela_ausente') return void mostrar(telaFaltaTabela());
    erro.textContent = mensagemDe(falha);
    erro.hidden = false;
  }

  function desenhar() {
    if (tarefas.length === 0) {
      lista.replaceChildren(el('p', { class: 'vazio' }, 'Nenhuma tarefa ainda. Que tal a primeira?'));
      return;
    }
    const feitas = tarefas.filter((t) => t.feita).length;
    lista.replaceChildren(
      el(
        'ul',
        { class: 'lista' },
        tarefas.map((t) =>
          el(
            'li',
            { class: t.feita ? 'tarefa feita' : 'tarefa' },
            el('input', {
              type: 'checkbox',
              class: 'caixa',
              checked: t.feita,
              'aria-label': `Marcar "${t.titulo}" como ${t.feita ? 'pendente' : 'feita'}`,
              onchange: () => void alternar(t),
            }),
            el('span', { class: 'tarefa-titulo' }, t.titulo),
            el('button', { class: 'apagar', 'aria-label': `Apagar "${t.titulo}"`, onclick: () => void apagar(t) }, '×'),
          ),
        ),
      ),
      el('p', { class: 'contador' }, `${feitas} de ${tarefas.length} ${tarefas.length === 1 ? 'feita' : 'feitas'}`),
    );
  }

  async function carregar() {
    try {
      tarefas = await listarTarefas(superdb);
      desenhar();
    } catch (falha) {
      falhou(falha);
    }
  }

  async function criar(evento) {
    evento.preventDefault();
    adicionar.disabled = true;
    adicionar.textContent = 'Salvando…';
    try {
      tarefas = [await criarTarefa(superdb, entrada.value), ...(tarefas ?? [])];
      entrada.value = '';
      erro.hidden = true;
      desenhar();
    } catch (falha) {
      falhou(falha);
    } finally {
      adicionar.textContent = 'Adicionar';
      adicionar.disabled = !entrada.value.trim();
      entrada.focus();
    }
  }

  // Alternar e apagar mudam a tela na hora e desfazem se o servidor recusar.
  async function alternar(tarefa) {
    tarefa.feita = !tarefa.feita;
    desenhar();
    try {
      await alternarTarefa(superdb, tarefa.id, tarefa.feita);
    } catch (falha) {
      tarefa.feita = !tarefa.feita;
      desenhar();
      falhou(falha);
    }
  }

  async function apagar(tarefa) {
    const antes = tarefas;
    tarefas = tarefas.filter((t) => t.id !== tarefa.id);
    desenhar();
    try {
      await apagarTarefa(superdb, tarefa.id);
    } catch (falha) {
      tarefas = antes;
      desenhar();
      falhou(falha);
    }
  }

  void carregar();
  return cartao;
}

function telaFaltaTabela() {
  return el(
    'section',
    { class: 'cartao' },
    el('h1', { class: 'titulo' }, 'Falta criar a tabela'),
    el('p', { class: 'subtitulo' }, 'O app está ligado ao projeto, mas a tabela ', el('code', {}, 'tarefas'), ' ainda não existe.'),
    el(
      'ol',
      { class: 'lista-numerada' },
      el('li', {}, 'Abra o projeto no painel do SuperDB e clique em SQL Editor.'),
      el('li', {}, 'Cole o conteúdo do arquivo ', el('code', {}, 'superdb/schema.sql'), ' deste template e rode.'),
      el('li', {}, 'Volte aqui e confira de novo.'),
    ),
    el(
      'div',
      { class: 'acoes' },
      el('a', { class: 'botao', href: 'https://app.superdb.com.br', target: '_blank', rel: 'noreferrer' }, 'Abrir o painel'),
      el('button', { class: 'botao botao-secundario', onclick: () => mostrar(telaTarefas()) }, 'Conferir de novo'),
    ),
  );
}

// ── Qual tela mostrar ────────────────────────────────────────

function desenharPara(sessao) {
  atualizarCabecalho(sessao);
  if (sessao) mostrar(telaTarefas());
  // Confere a ligação com o projeto, só enquanto o app roda na sua máquina.
  else if (emDesenvolvimento) mostrar(telaEntrar(), telaDiagnostico());
  else mostrar(telaEntrar());
}

if (!configurado) {
  mostrar(telaDiagnostico());
} else {
  // Login, saída e renovação, inclusive em outra aba, chegam por aqui.
  let atual = null;
  app.aoMudar((sessao) => {
    // Renovação troca o token, não a pessoa: não precisa redesenhar a tela.
    if (Boolean(sessao) === Boolean(atual) && usuarioDa(sessao)?.id === usuarioDa(atual)?.id) {
      atual = sessao;
      return;
    }
    atual = sessao;
    desenharPara(sessao);
  });
  app
    .sessao()
    .catch(() => null)
    .then((sessao) => {
      atual = sessao;
      desenharPara(sessao);
    });
}
