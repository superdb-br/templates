# AGENTS.md · Tarefas · SvelteKit + SuperDB

Instruções para agentes de IA (Claude Code, Cursor, Codex e outros) que trabalham neste projeto.

## O projeto

- SPA estática em SvelteKit 2 + Svelte 5 (runes) + TypeScript, com backend **SuperDB** (Postgres + auth + Row Level Security).
- Comandos: `npm run dev` (http://localhost:5173), `npm run check` (svelte-check) e `npm run build` (arquivos estáticos em `build/`).
- Variáveis em `.env`: `VITE_SUPERDB_URL`, `VITE_SUPERDB_ANON_KEY`, `VITE_SUPERDB_PROJECT`.

## Como falar com o SuperDB

1. Use sempre o cliente de `src/lib/superdb.ts`: `import { superdb, app } from '$lib/superdb'`. Não crie outro `createClient`.
2. O cliente foi criado com `project` (o slug). Sem ele, `superdb.from()` lança erro: é o que aponta as consultas para o schema do projeto.
3. Dados: `superdb.from('tabela').select('col1,col2')`, `.insert()`, `.update().eq()`, `.delete().eq()`, `.rpc()`. A API é a do `supabase-js`.
4. Sessão: `app.entrar(email, senha)`, `app.criarConta(email, senha)`, `app.sair()`, `app.sessao()` (já renovada se estiver vencendo) e `app.aoMudar(fn)`. O SDK **não** tem `onAuthStateChange` nem renova o token sozinho: é por isso que `src/lib/superdb/sessao.ts` existe. Não remova nem contorne.
5. Erros: converta com `traduzirErroDeDados` / `traduzirErroDeLogin` (`src/lib/superdb/erros.ts`) e mostre `mensagemDe(erro)`. Não mostre `error.message` cru do SDK para o usuário.
6. Nova operação de dados: siga o molde de `src/lib/superdb/tarefas.ts` (colunas pelo nome, erro traduzido, sem filtro por usuário: quem filtra é o RLS).
7. Estado da sessão: `import { sessaoAtual } from '$lib/sessao.svelte'` (`sessaoAtual.sessao`, reativo).
8. O app é SPA (`ssr = false` no `+layout.ts`): a sessão vive no `localStorage`. Não reative o SSR sem mover a sessão para cookies.
9. As variáveis vêm de `import.meta.env.VITE_*`, não de `$env/static/public`: sem `.env`, `$env/static` quebraria o build.

## Banco de dados: toda tabela nova precisa de RLS

No SuperDB, **tabela nova nasce fechada**: o RLS vem ligado e sem policy, e só o dono do projeto e a service key enxergam as linhas. Para o app usar a tabela, ela precisa, no mesmo SQL que a cria:

```sql
alter table minha_tabela enable row level security;
create policy minha_tabela_do_dono on minha_tabela
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke all on minha_tabela from anon;
grant select, insert, update, delete on minha_tabela to authenticated;
```

- Dono da linha: `user_id uuid not null default auth.uid()`. O app nunca manda `user_id`.
- Ids: `uuid primary key default gen_random_uuid()`. Um id sequencial entrega a contagem de linhas e deixa adivinhar o id dos outros.
- Guarde o SQL em `superdb/*.sql`, idempotente (`create table if not exists`, `drop policy if exists` antes de `create policy`), e rode no **SQL Editor** do painel, ou pelo MCP do SuperDB (tool `superdb_run_sql`).
- O SQL Editor recusa `BEGIN`/`COMMIT` (ele já roda tudo numa transação) e `SET ROLE`.
- O SQL Editor recusa o arquivo inteiro se aparecer o nome de um schema de sistema seguido de ponto (`storage.`, `realtime.`, `pg_catalog.`...), **inclusive em comentário**.
- `auth.uid()`, `auth.email()` e `auth.jwt()` estão disponíveis nas policies.
- Consulta voltando vazia com usuário logado quase sempre é policy faltando. Nunca "resolva" desligando o RLS.

## Nunca

- Nunca coloque a **service key** no app. Só a chave anon vai no código do cliente.
- Nunca desligue o RLS nem dê `grant` para `anon` numa tabela com dados de usuário.
- Nunca mande o `access_token` para a API de dados: ela só aceita o `data_plane_token` (o SDK já escolhe o certo).
- Nunca invente endpoint: não existe `/rest/v1` no SuperDB. A API de dados fica em `https://api.superdb.com.br/<tabela>`.

## Referências

- Documentação: https://superdb.com.br/docs/
- Tudo em um arquivo, para IA: https://superdb.com.br/llms.txt
- Row Level Security: https://superdb.com.br/docs/cookbook/rls
- SDK: https://www.npmjs.com/package/@superdb/client
