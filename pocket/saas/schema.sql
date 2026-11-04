-- Pocket · SaaS com organizações e assinatura
--
-- Organizações, membros com papel (dono, admin, membro), convites por e-mail e a
-- assinatura de cada organização. O RLS separa por organização: quem não é
-- membro não vê nada dela.
--
-- COMO USAR
--   O botão "Usar este modelo" (superdb.com.br/pocket/saas) roda este arquivo
--   no seu projeto. À mão: painel do SuperDB > SQL Editor > cole e rode. Pode
--   rodar de novo: nada é duplicado e nenhum dado é apagado.
--
-- A COBRANÇA É UM PONTO DE EXTENSÃO
--   A tabela assinaturas guarda o estado do plano, mas nenhum usuário grava
--   nela: só o seu servidor, com a service key, a partir do webhook do gateway
--   que você escolher (Asaas, Stripe, Mercado Pago...). Ver o README.
--
-- SEGURANÇA
--   - Criar organização e aceitar convite são funções (criar_organizacao e
--     aceitar_convite): ninguém se põe como membro de uma organização à mão.
--   - O convite só vale para quem entra com o e-mail convidado, até expirar.
--   - A chave anon não lê nem grava nada aqui.

create table if not exists organizacoes (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null check (char_length(btrim(nome)) between 1 and 120),
  criado_por uuid not null default auth.uid(),
  criado_em  timestamptz not null default now()
);

create table if not exists membros (
  organizacao_id uuid not null references organizacoes(id) on delete cascade,
  user_id        uuid not null,
  email          text not null,
  papel          text not null default 'membro' check (papel in ('dono', 'admin', 'membro')),
  criado_em      timestamptz not null default now(),
  primary key (organizacao_id, user_id)
);
create index if not exists membros_por_usuario on membros (user_id);

create table if not exists convites (
  id             uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references organizacoes(id) on delete cascade,
  email          text not null check (email = lower(email) and email ~ '^[^@\s]+@[^@\s]+$'),
  papel          text not null default 'membro' check (papel in ('admin', 'membro')),
  token          text not null unique default md5(gen_random_uuid()::text || clock_timestamp()::text),
  expira_em      timestamptz not null default now() + interval '7 days',
  aceito_em      timestamptz,
  criado_em      timestamptz not null default now()
);
create index if not exists convites_por_org on convites (organizacao_id);

create table if not exists assinaturas (
  organizacao_id     uuid primary key references organizacoes(id) on delete cascade,
  plano              text not null default 'gratis',
  estado             text not null default 'teste' check (estado in ('teste', 'ativa', 'atrasada', 'cancelada')),
  vence_em           timestamptz,
  referencia_externa text,
  atualizado_em      timestamptz not null default now()
);

alter table organizacoes enable row level security;
alter table membros      enable row level security;
alter table convites     enable row level security;
alter table assinaturas  enable row level security;

-- O papel de quem pergunta numa organização, ou nulo se não for membro.
create or replace function papel_na_org(p_org uuid) returns text
language sql stable security definer set search_path from current as $$
  select papel from membros where organizacao_id = p_org and user_id = auth.uid()
$$;

drop policy if exists organizacoes_ver on organizacoes;
create policy organizacoes_ver on organizacoes for select to authenticated
  using (papel_na_org(id) is not null);
drop policy if exists organizacoes_editar on organizacoes;
create policy organizacoes_editar on organizacoes for update to authenticated
  using (papel_na_org(id) in ('dono', 'admin')) with check (papel_na_org(id) in ('dono', 'admin'));
drop policy if exists organizacoes_apagar on organizacoes;
create policy organizacoes_apagar on organizacoes for delete to authenticated
  using (papel_na_org(id) = 'dono');

drop policy if exists membros_ver on membros;
create policy membros_ver on membros for select to authenticated
  using (papel_na_org(organizacao_id) is not null);
-- Admin muda o papel de quem não é dono, e ninguém vira dono por aqui.
drop policy if exists membros_mudar_papel on membros;
create policy membros_mudar_papel on membros for update to authenticated
  using (papel_na_org(organizacao_id) in ('dono', 'admin') and papel <> 'dono')
  with check (papel_na_org(organizacao_id) in ('dono', 'admin') and papel <> 'dono');
-- Admin remove quem não é dono; cada um pode sair (o dono não sai, apaga a organização).
drop policy if exists membros_remover on membros;
create policy membros_remover on membros for delete to authenticated
  using (papel <> 'dono' and (papel_na_org(organizacao_id) in ('dono', 'admin') or user_id = auth.uid()));

drop policy if exists convites_admin on convites;
create policy convites_admin on convites for all to authenticated
  using (papel_na_org(organizacao_id) in ('dono', 'admin'))
  with check (papel_na_org(organizacao_id) in ('dono', 'admin') and aceito_em is null);

drop policy if exists assinaturas_ver on assinaturas;
create policy assinaturas_ver on assinaturas for select to authenticated
  using (papel_na_org(organizacao_id) is not null);

revoke all on organizacoes, membros, convites, assinaturas from anon, authenticated;
grant select, update, delete on organizacoes to authenticated;
grant select, delete on membros to authenticated;
grant update (papel) on membros to authenticated;
grant select, insert, delete on convites to authenticated;
grant select on assinaturas to authenticated;

-- Cria a organização com quem chamou como dono e uma assinatura em teste.
create or replace function criar_organizacao(p_nome text) returns uuid
language plpgsql volatile security definer set search_path from current as $$
declare
  v_id uuid;
begin
  if auth.uid() is null or auth.email() is null then
    raise exception 'sem_sessao';
  end if;
  if char_length(btrim(coalesce(p_nome, ''))) not between 1 and 120 then
    raise exception 'dados_invalidos';
  end if;
  insert into organizacoes (nome, criado_por) values (btrim(p_nome), auth.uid()) returning id into v_id;
  insert into membros (organizacao_id, user_id, email, papel) values (v_id, auth.uid(), lower(auth.email()), 'dono');
  insert into assinaturas (organizacao_id) values (v_id);
  return v_id;
end $$;

-- Aceita o convite do token, se ele for para o e-mail de quem chamou e não tiver
-- expirado. Devolve a organização. Recusa com 'convite_invalido'.
create or replace function aceitar_convite(p_token text) returns uuid
language plpgsql volatile security definer set search_path from current as $$
declare
  v_convite convites;
begin
  select * into v_convite from convites
   where token = p_token and aceito_em is null and expira_em > now() and email = lower(auth.email())
   for update;
  if v_convite.id is null or auth.uid() is null then
    raise exception 'convite_invalido';
  end if;
  insert into membros (organizacao_id, user_id, email, papel)
  values (v_convite.organizacao_id, auth.uid(), v_convite.email, v_convite.papel)
  on conflict (organizacao_id, user_id) do nothing;
  update convites set aceito_em = now() where id = v_convite.id;
  return v_convite.organizacao_id;
end $$;

revoke all on function papel_na_org(uuid), criar_organizacao(text), aceitar_convite(text) from public, anon;
grant execute on function papel_na_org(uuid), criar_organizacao(text), aceitar_convite(text) to authenticated;
