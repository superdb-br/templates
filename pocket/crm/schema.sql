-- Pocket · CRM simples
--
-- Empresas, contatos, um funil com etapas, negócios andando pelo funil e as
-- atividades de cada um (ligação, reunião, tarefa), com data para lembrar.
-- Cada pessoa tem o próprio CRM: ninguém vê os contatos de outra.
--
-- COMO USAR
--   O botão "Usar este modelo" (superdb.com.br/pocket/crm) roda este arquivo no
--   seu projeto. À mão: painel do SuperDB > SQL Editor > cole e rode. Pode rodar
--   de novo: nada é duplicado e nenhum dado é apagado.
--
-- SEGURANÇA
--   - RLS em toda tabela: cada linha é de quem criou (dono_id = auth.uid()).
--   - Um negócio só aponta para etapa, contato e empresa do mesmo dono: a policy
--     confere, e não adianta mandar o id de outra pessoa.
--   - A chave anon não lê nem grava nada aqui.

create table if not exists empresas (
  id        uuid primary key default gen_random_uuid(),
  dono_id   uuid not null default auth.uid(),
  nome      text not null check (char_length(btrim(nome)) between 1 and 160),
  site      text check (char_length(site) <= 200),
  criado_em timestamptz not null default now()
);
create index if not exists empresas_por_dono on empresas (dono_id, nome);

create table if not exists contatos (
  id         uuid primary key default gen_random_uuid(),
  dono_id    uuid not null default auth.uid(),
  empresa_id uuid references empresas(id) on delete set null,
  nome       text not null check (char_length(btrim(nome)) between 1 and 160),
  email      text check (char_length(email) <= 200),
  telefone   text check (char_length(telefone) <= 30),
  criado_em  timestamptz not null default now()
);
create index if not exists contatos_por_dono on contatos (dono_id, nome);

create table if not exists etapas (
  id      uuid primary key default gen_random_uuid(),
  dono_id uuid not null default auth.uid(),
  nome    text not null check (char_length(btrim(nome)) between 1 and 60),
  ordem   int  not null default 0,
  ganho   boolean not null default false,
  perdido boolean not null default false
);
create index if not exists etapas_por_dono on etapas (dono_id, ordem);

create table if not exists negocios (
  id             uuid primary key default gen_random_uuid(),
  dono_id        uuid not null default auth.uid(),
  titulo         text not null check (char_length(btrim(titulo)) between 1 and 160),
  valor_centavos bigint not null default 0 check (valor_centavos >= 0),
  etapa_id       uuid not null references etapas(id) on delete restrict,
  contato_id     uuid references contatos(id) on delete set null,
  empresa_id     uuid references empresas(id) on delete set null,
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now()
);
create index if not exists negocios_por_dono on negocios (dono_id, etapa_id);

create table if not exists atividades (
  id          uuid primary key default gen_random_uuid(),
  dono_id     uuid not null default auth.uid(),
  negocio_id  uuid references negocios(id) on delete cascade,
  contato_id  uuid references contatos(id) on delete cascade,
  tipo        text not null default 'tarefa' check (tipo in ('ligacao', 'reuniao', 'email', 'tarefa', 'nota')),
  descricao   text not null check (char_length(btrim(descricao)) between 1 and 2000),
  lembrar_em  timestamptz,
  feita       boolean not null default false,
  criado_em   timestamptz not null default now()
);
create index if not exists atividades_lembretes on atividades (dono_id, feita, lembrar_em);

alter table empresas   enable row level security;
alter table contatos   enable row level security;
alter table etapas     enable row level security;
alter table negocios   enable row level security;
alter table atividades enable row level security;

drop policy if exists empresas_do_dono on empresas;
create policy empresas_do_dono on empresas for all to authenticated
  using (dono_id = auth.uid()) with check (dono_id = auth.uid());

-- As referências passam pelo RLS da tabela de destino: o id de outra pessoa não existe para você.
drop policy if exists contatos_do_dono on contatos;
create policy contatos_do_dono on contatos for all to authenticated
  using (dono_id = auth.uid())
  with check (dono_id = auth.uid() and (empresa_id is null or exists (select 1 from empresas e where e.id = empresa_id)));

drop policy if exists etapas_do_dono on etapas;
create policy etapas_do_dono on etapas for all to authenticated
  using (dono_id = auth.uid()) with check (dono_id = auth.uid());

drop policy if exists negocios_do_dono on negocios;
create policy negocios_do_dono on negocios for all to authenticated
  using (dono_id = auth.uid())
  with check (
    dono_id = auth.uid()
    and exists (select 1 from etapas t where t.id = etapa_id)
    and (contato_id is null or exists (select 1 from contatos c where c.id = contato_id))
    and (empresa_id is null or exists (select 1 from empresas e where e.id = empresa_id))
  );

drop policy if exists atividades_do_dono on atividades;
create policy atividades_do_dono on atividades for all to authenticated
  using (dono_id = auth.uid())
  with check (
    dono_id = auth.uid()
    and (negocio_id is null or exists (select 1 from negocios n where n.id = negocio_id))
    and (contato_id is null or exists (select 1 from contatos c where c.id = contato_id))
  );

revoke all on empresas, contatos, etapas, negocios, atividades from anon, authenticated;
grant select, insert, update, delete on empresas, contatos, etapas, negocios, atividades to authenticated;

-- O funil padrão, criado na primeira vez que a pessoa abre o CRM. Não duplica.
create or replace function criar_etapas_padrao() returns void
language sql volatile security invoker set search_path from current as $$
  insert into etapas (nome, ordem, ganho, perdido)
  select e.nome, e.ordem, e.ganho, e.perdido
    from (values ('Novo', 1, false, false), ('Contato feito', 2, false, false), ('Proposta', 3, false, false),
                 ('Ganho', 4, true, false), ('Perdido', 5, false, true)) as e(nome, ordem, ganho, perdido)
   where auth.uid() is not null and not exists (select 1 from etapas where dono_id = auth.uid())
$$;

revoke all on function criar_etapas_padrao() from public, anon;
grant execute on function criar_etapas_padrao() to authenticated;
