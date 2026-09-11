# AGENTS.md · Tarefas · HTML puro + SuperDB

Instruções para agentes de IA (Claude Code, Cursor, Codex e outros) que trabalham neste projeto.

## O projeto

- Site sem build: `index.html` + `app.js` (DOM puro) + `config.js`, com backend **SuperDB** (Postgres + auth + Row Level Security).
- O SDK vem do esm.sh pelo import map do `index.html` (`@superdb/client@0.2.2`, versão fixa).
- Rodar: sirva a pasta (`npx serve .`). Módulos não carregam por `file://`.
- Configuração em `config.js` (`url`, `anonKey`, `projeto`). Não há `.env`.

## Como falar com o SuperDB

1. O cliente é criado uma vez no `app.js`: `const app = criarSuperDB(config)` e `const superdb = app.superdb`. Não crie outro.
2. Dados: `superdb.from('tabela').select('col1,col2')`, `.insert()`, `.update().eq()`, `.delete().eq()`. A API é a do `supabase-js`.
3. Sessão: `app.entrar()`, `app.criarConta()`, `app.sair()`, `app.sessao()`, `app.aoMudar(fn)`. O SDK **não** tem `onAuthStateChange` nem renova o token sozinho: é por isso que `js/superdb/sessao.js` existe.
4. Erros: `traduzirErroDeDados` / `traduzirErroDeLogin` e `mensagemDe(erro)` (`js/superdb/erros.js`).
5. **Texto que veio do banco ou do usuário entra com `textContent`, nunca com `innerHTML`.** Use o helper `el()` do `app.js`, que já faz isso.

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
