-- Tarefas: a tabela do template, protegida por Row Level Security (RLS).
--
-- COMO USAR
--   Abra o painel do SuperDB, entre no seu projeto, clique em "SQL Editor",
--   cole este arquivo inteiro e rode. Pode rodar de novo quando quiser: nada
--   é duplicado e nenhuma tarefa é apagada.
--
-- O QUE ELE GARANTE
--   1. Cada pessoa só enxerga, altera e apaga as PRÓPRIAS tarefas.
--   2. A chave anon (a que vai no código do app) não lê nada sem login.
--   3. O dono de cada linha é preenchido pelo banco, a partir do token de quem
--      chamou. O app nunca manda user_id, e não adianta forjar um.
--
-- POR QUE AS POLICIES SÃO OBRIGATÓRIAS AQUI
--   No SuperDB, toda tabela nova nasce com o RLS ligado e sem nenhuma policy:
--   fora o dono do projeto e a service key, ninguém lê nem grava nada nela.
--   Sem as linhas abaixo, o login funciona, mas a lista volta sempre vazia e
--   todo insert é recusado. A policy abre para cada pessoa só as próprias
--   linhas, e o revoke tira da chave anon até a permissão na tabela, para que
--   uma policy aberta demais, criada no futuro, não chegue até ela.

create table if not exists tarefas (
  id         uuid        primary key default gen_random_uuid(),
  titulo     text        not null check (char_length(btrim(titulo)) between 1 and 200),
  feita      boolean     not null default false,
  criada_em  timestamptz not null default now(),
  user_id    uuid        not null default auth.uid()
);

-- A lista do app sempre busca "as minhas, das mais novas para as mais antigas".
create index if not exists tarefas_por_dono on tarefas (user_id, criada_em desc);

alter table tarefas enable row level security;

-- Uma regra só, para ler, criar, alterar e apagar: a linha é sua ou não existe.
-- "using" filtra o que você vê; "with check" recusa gravar linha de outra pessoa.
drop policy if exists tarefas_do_dono on tarefas;
create policy tarefas_do_dono on tarefas
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

revoke all on tarefas from anon;
grant select, insert, update, delete on tarefas to authenticated;
