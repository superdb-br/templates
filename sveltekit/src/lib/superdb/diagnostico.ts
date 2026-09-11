// Confere se o app está ligado ao projeto certo e diz o que falta quando não está.
//
// É o que a tela inicial do template mostra: na primeira vez que alguém roda o
// app, quase sempre falta uma variável ou o schema.sql. Em vez de um erro solto
// no console, a tela diz qual passo falta e como resolver.

import { createClient } from '@superdb/client';
import { traduzirErroDeDados } from './erros';

export type Passo = {
  id: 'variaveis' | 'projeto' | 'tabela';
  estado: 'ok' | 'falta' | 'aviso';
  titulo: string;
  detalhe: string;
};

export type ConfigParcial = { url?: string; anonKey?: string; projeto?: string };

/** Como cada framework chama as variáveis (VITE_..., NEXT_PUBLIC_..., EXPO_PUBLIC_...). */
export type NomesDasVariaveis = { url: string; anonKey: string; projeto: string };

export async function diagnosticar(
  config: ConfigParcial,
  nomes: NomesDasVariaveis,
  opcoes: { fetch?: typeof fetch } = {},
): Promise<Passo[]> {
  const fetchBase: typeof fetch = opcoes.fetch ?? ((entrada, init) => globalThis.fetch(entrada, init));
  const faltando = (['url', 'anonKey', 'projeto'] as const).filter((k) => !config[k]?.trim());
  if (faltando.length > 0) {
    return [
      {
        id: 'variaveis',
        estado: 'falta',
        titulo: 'Variáveis de ambiente',
        detalhe:
          `Falta preencher: ${faltando.map((k) => nomes[k]).join(', ')}. ` +
          'Copie o .env.example para .env e use os valores do painel (botão "Conectar" do projeto).',
      },
    ];
  }

  const url = config.url!.trim().replace(/\/+$/, '');
  const projeto = config.projeto!.trim();
  const anonKey = config.anonKey!.trim();
  const passos: Passo[] = [
    { id: 'variaveis', estado: 'ok', titulo: 'Variáveis de ambiente', detalhe: 'URL, chave anon e projeto preenchidos.' },
  ];

  // O projeto existe? Sem token, o auth responde 401 para projeto válido e 404
  // para slug que não existe.
  let resposta: Response;
  try {
    resposta = await fetchBase(`${url}/auth/v1/user`, {
      headers: { 'X-SuperDB-Project': projeto, apikey: anonKey },
    });
  } catch {
    passos.push({
      id: 'projeto',
      estado: 'falta',
      titulo: 'Projeto',
      detalhe: `Não consegui falar com ${url}. Confira ${nomes.url}: no SuperDB em nuvem ela é https://auth.superdb.com.br.`,
    });
    return passos;
  }
  if (resposta.status === 404) {
    passos.push({
      id: 'projeto',
      estado: 'falta',
      titulo: 'Projeto',
      detalhe: `O projeto "${projeto}" não existe. Confira ${nomes.projeto}: é o slug que aparece no endereço do projeto no painel.`,
    });
    return passos;
  }
  passos.push({ id: 'projeto', estado: 'ok', titulo: 'Projeto', detalhe: `Projeto "${projeto}" encontrado.` });

  // A tabela existe e está fechada para quem não entrou? Consulta SEM login, de
  // propósito: é a chave anon que está sendo testada.
  const semLogin = createClient(url, anonKey, { project: projeto, storage: memoria(), fetch: fetchBase });
  const { error, status } = await semLogin.from('tarefas').select('id').limit(1);

  if (!error) {
    passos.push({
      id: 'tabela',
      estado: 'aviso',
      titulo: 'Tabela "tarefas"',
      detalhe:
        'A chave anon ainda tem acesso à tabela: o superdb/schema.sql não rodou inteiro. Rode de novo: ele cria a policy de cada dono e fecha o acesso anônimo.',
    });
  } else if (error.code === '42501') {
    passos.push({ id: 'tabela', estado: 'ok', titulo: 'Tabela "tarefas"', detalhe: 'Criada e protegida por RLS.' });
  } else {
    const traduzido = traduzirErroDeDados(error, status);
    const recusouChave = traduzido.codigo === 'sessao_expirada';
    passos.push({
      id: 'tabela',
      estado: 'falta',
      titulo: 'Tabela "tarefas"',
      detalhe: recusouChave
        ? `A API de dados recusou a chave anon. Copie ${nomes.anonKey} de novo no painel.`
        : traduzido.message,
    });
  }
  return passos;
}

function memoria() {
  const mapa = new Map<string, string>();
  return {
    getItem: (chave: string) => mapa.get(chave) ?? null,
    setItem: (chave: string, valor: string) => void mapa.set(chave, valor),
    removeItem: (chave: string) => void mapa.delete(chave),
  };
}
