# AGENTS.md · Tarefas · Expo + SuperDB

Instruções para agentes de IA (Claude Code, Cursor, Codex e outros) que trabalham neste projeto.

## O projeto

- App Expo (SDK 57) + React Native 0.86 + TypeScript estrito, com backend **SuperDB** (Postgres + auth + Row Level Security).
- Comandos: `npx expo start` e `npm run typecheck`.
- Variáveis em `.env`: `EXPO_PUBLIC_SUPERDB_URL`, `EXPO_PUBLIC_SUPERDB_ANON_KEY`, `EXPO_PUBLIC_SUPERDB_PROJECT` (entram no app na hora do bundle).

## Como falar com o SuperDB

1. Use sempre o cliente de `src/superdb.ts`: `import { superdb, app } from './superdb'`. Não crie outro `createClient`.
2. A sessão fica no **AsyncStorage** (passado como `armazenamento`). Sem ele, a pessoa teria que entrar a cada abertura do app.
3. Dados: `superdb.from('tabela').select('col1,col2')`, `.insert()`, `.update().eq()`, `.delete().eq()`. A API é a do `supabase-js`.
4. Sessão: `app.entrar()`, `app.criarConta()`, `app.sair()`, `app.sessao()`, `app.aoMudar(fn)`. O SDK **não** tem `onAuthStateChange` nem renova o token sozinho: é por isso que `src/lib/superdb/sessao.ts` existe.
5. Erros: `traduzirErroDeDados` / `traduzirErroDeLogin` e `mensagemDe(erro)` (`src/lib/superdb/erros.ts`).
6. Campos de e-mail: `autoCapitalize="none"`, `autoCorrect={false}` e `keyboardType="email-address"`. A correção automática do iOS troca palavras do e-mail.
7. Login social (Google/Apple) no celular usa PKCE, que precisa de Web Crypto: instale um polyfill antes (o SDK avisa se faltar).

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
