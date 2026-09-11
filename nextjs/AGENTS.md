# AGENTS.md · Tarefas · Next.js + SuperDB

Instruções para agentes de IA (Claude Code, Cursor, Codex e outros) que trabalham neste projeto.

## O projeto

- Next.js 16 (App Router, Server Components, Server Actions) + React 19 + TypeScript estrito, com backend **SuperDB** (Postgres + auth + Row Level Security).
- Comandos: `npm run dev` (http://localhost:3000) e `npm run build`.
- Variáveis em `.env.local`: `NEXT_PUBLIC_SUPERDB_URL`, `NEXT_PUBLIC_SUPERDB_ANON_KEY`, `NEXT_PUBLIC_SUPERDB_PROJECT`.

## Como falar com o SuperDB

1. No servidor, crie o cliente **por requisição**: `const superdb = await superdbDoServidor()` (`lib/superdb/servidor.ts`). Ele lê a sessão dos cookies desta requisição.
2. **Nunca** guarde o cliente numa variável de módulo: no servidor ela seria compartilhada entre visitantes.
3. A sessão fica em quatro cookies httpOnly (`lib/superdb/cookies.ts`). Não mova tokens para `localStorage` nem os exponha a Client Components.
4. A renovação acontece só no `proxy.ts` (o antigo middleware, renomeado no Next 16), com `lib/superdb/renovar.ts`. Não renove em outro lugar: o SuperDB troca o refresh token a cada renovação e trata reuso como roubo, então duas renovações com o mesmo token derrubam a sessão.
5. O proxy **não protege** nada. Toda página com dados de usuário confere a sessão (`redirect('/')` sem sessão) e **toda Server Action confere de novo** antes de agir: Server Actions são endpoints públicos. Siga o molde de `comSessao()` em `app/tarefas/acoes.ts`.
6. Server Action devolve `{ erro }` em vez de lançar exceção: em produção, a mensagem de uma exceção não chega ao navegador.
7. Dados: `superdb.from('tabela').select('col1,col2')` etc. A API é a do `supabase-js`. Nova operação: siga `lib/superdb/tarefas.ts`.
8. Erros: `traduzirErroDeDados` / `traduzirErroDeLogin` e `mensagemDe(erro)` (`lib/superdb/erros.ts`).

## Banco de dados: toda tabela nova precisa de RLS

No SuperDB, **tabela nova nasce aberta**: a chave anon consegue ler e qualquer usuário logado consegue escrever. Toda tabela nova precisa, no mesmo SQL que a cria:

```sql
alter table minha_tabela enable row level security;
create policy minha_tabela_do_dono on minha_tabela
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke all on minha_tabela from anon;
grant select, insert, update, delete on minha_tabela to authenticated;
```

- Dono da linha: `user_id uuid not null default auth.uid()`. O app nunca manda `user_id`.
- Ids: `uuid primary key default gen_random_uuid()`. Não use `serial`: a sequência não recebe permissão e o `insert` do usuário logado falha.
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
