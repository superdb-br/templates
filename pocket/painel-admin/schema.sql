-- Pocket · Painel administrativo
--
-- O esqueleto que todo app interno pede: quem entra no painel, com que papel
-- (admin ou leitor), e telas de listar, buscar, paginar, criar, editar e apagar
-- sobre as tabelas do seu projeto.
--
-- COMO USAR
--   O botão "Usar este modelo" (superdb.com.br/pocket/painel-admin) roda este
--   arquivo no seu projeto. À mão: painel do SuperDB > SQL Editor > cole e rode.
--   Pode rodar de novo: nada é duplicado e nenhum dado é apagado.
--
-- COMO O PAINEL ENXERGA AS SUAS TABELAS
--   O painel não fura o RLS: ele lê e grava com o token de quem entrou. Para uma
--   tabela sua aparecer, dê a ela policies que usem papel_no_painel(), como a
--   exemplo_registros abaixo:
--     using (papel_no_painel() is not null)        -- admin e leitor leem
--     using (papel_no_painel() = 'admin')          -- só admin grava
--
-- SEGURANÇA
--   - Ninguém vira admin sozinho. O primeiro admin é cadastrado por você, dono
--     do projeto, no SQL Editor:
--       insert into perfis_admin (email, papel) values ('seu@email.com', 'admin')
--       returning convite_token;
--     e você abre /painel/convite/<token> no app, logado com esse e-mail.
--     Depois, um admin convida pelo painel: o convite é um link com token, que
--     só vale para quem entrar com o e-mail convidado.
--   - A chave anon não lê nem grava nada aqui.

create table if not exists perfis_admin (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid unique,
  email     text not null unique check (email = lower(email) and email ~ '^[^@\s]+@[^@\s]+$'),
  papel     text not null default 'leitor' check (papel in ('admin', 'leitor')),
  -- O convite: quem tem este token E entra com este e-mail assume o perfil.
  convite_token text unique default md5(gen_random_uuid()::text || clock_timestamp()::text),
  criado_em timestamptz not null default now()
);
-- Quem já tinha a tabela de uma versão anterior do modelo ganha a coluna.
alter table perfis_admin add column if not exists convite_token text unique
  default md5(gen_random_uuid()::text || clock_timestamp()::text);

create table if not exists exemplo_registros (
  id        uuid primary key default gen_random_uuid(),
  titulo    text not null check (char_length(btrim(titulo)) between 1 and 200),
  situacao  text not null default 'aberto' check (situacao in ('aberto', 'em andamento', 'fechado')),
  valor     numeric(12, 2),
  criado_em timestamptz not null default now()
);

alter table perfis_admin      enable row level security;
alter table exemplo_registros enable row level security;

-- O papel de quem pergunta: 'admin', 'leitor' ou nulo (fora do painel).
create or replace function papel_no_painel() returns text
language sql stable security definer set search_path from current as $$
  select papel from perfis_admin where user_id = auth.uid()
$$;

-- Aceita o convite: o perfil com este token e o e-mail de quem chamou passa a
-- ser desta conta, e o token deixa de valer. Precisa dos DOIS: o e-mail do
-- token de login vem do cadastro, que não prova posse do e-mail; sozinho, ele
-- deixaria quem se cadastrasse antes com o e-mail de outra pessoa herdar o
-- papel dela. Devolve o papel, ou nulo.
create or replace function aceitar_convite_do_painel(p_token text) returns text
language plpgsql volatile security definer set search_path from current as $$
begin
  if auth.uid() is null or auth.email() is null or coalesce(p_token, '') = '' then
    return null;
  end if;
  update perfis_admin set user_id = auth.uid(), convite_token = null
   where convite_token = p_token and user_id is null and email = lower(auth.email());
  return papel_no_painel();
end $$;

-- As tabelas do projeto que o painel lista (fora as da plataforma e a de perfis).
create or replace function tabelas_do_painel() returns setof text
language sql stable security definer set search_path from current as $$
  select c.relname::text
    from pg_class c
   where c.relnamespace = current_schema()::regnamespace
     and c.relkind in ('r', 'v', 'p')
     and c.relname !~ '^auth_'
     and c.relname <> 'perfis_admin'
     and papel_no_painel() is not null
   order by 1
$$;

drop policy if exists perfis_ver on perfis_admin;
create policy perfis_ver on perfis_admin for select to authenticated
  using (user_id = auth.uid() or papel_no_painel() = 'admin');
drop policy if exists perfis_admin_gerencia on perfis_admin;
create policy perfis_admin_gerencia on perfis_admin for all to authenticated
  using (papel_no_painel() = 'admin') with check (papel_no_painel() = 'admin');

drop policy if exists exemplo_ler on exemplo_registros;
create policy exemplo_ler on exemplo_registros for select to authenticated
  using (papel_no_painel() is not null);
drop policy if exists exemplo_admin_grava on exemplo_registros;
create policy exemplo_admin_grava on exemplo_registros for all to authenticated
  using (papel_no_painel() = 'admin') with check (papel_no_painel() = 'admin');

revoke all on perfis_admin, exemplo_registros from anon, authenticated;
grant select, insert, update, delete on perfis_admin, exemplo_registros to authenticated;

revoke all on function papel_no_painel(), aceitar_convite_do_painel(text), tabelas_do_painel() from public, anon;
grant execute on function papel_no_painel(), aceitar_convite_do_painel(text), tabelas_do_painel() to authenticated;
