-- Pocket · Agenda de salão ou barbearia
--
-- O cliente marca sem conta (só nome e telefone) pelo link do salão; o dono
-- entra com login e vê a agenda do dia. Cada dono só enxerga o próprio salão.
--
-- COMO USAR
--   O botão "Usar este modelo" (superdb.com.br/pocket/agenda) roda este arquivo
--   no seu projeto. À mão: painel do SuperDB > SQL Editor > cole e rode. Pode
--   rodar de novo: nada é duplicado e nenhum dado é apagado.
--
-- SEGURANÇA
--   - RLS em toda tabela. O dono vê e altera só o que é do salão dele.
--   - A chave anon (a do app) não lê nem grava tabela nenhuma. O que é público
--     sai por três funções que exigem o código do salão (16 caracteres
--     aleatórios): agenda_publica, horarios_livres e agendar.
--   - O dado do cliente (nome e telefone) é o mínimo para confirmar o horário,
--     e o dono pode apagar o agendamento quando quiser.
--   - As tabelas ficam no schema do seu projeto (sem "public."): o search_path
--     do SuperDB resolve.

create table if not exists saloes (
  id             uuid primary key default gen_random_uuid(),
  dono_id        uuid not null default auth.uid(),
  nome           text not null check (char_length(btrim(nome)) between 1 and 120),
  telefone       text check (telefone ~ '^\+[0-9]{12,13}$'),
  codigo_publico text not null unique default substr(md5(gen_random_uuid()::text), 1, 16)
                 check (codigo_publico ~ '^[a-z0-9-]{12,40}$'),
  criado_em      timestamptz not null default now()
);
create index if not exists saloes_por_dono on saloes (dono_id);

create table if not exists servicos (
  id             uuid primary key default gen_random_uuid(),
  salao_id       uuid not null references saloes(id) on delete cascade,
  nome           text not null check (char_length(btrim(nome)) between 1 and 120),
  duracao_min    int  not null check (duracao_min between 5 and 480),
  preco_centavos int  not null default 0 check (preco_centavos >= 0),
  ativo          boolean not null default true
);
create index if not exists servicos_por_salao on servicos (salao_id);

create table if not exists profissionais (
  id       uuid primary key default gen_random_uuid(),
  salao_id uuid not null references saloes(id) on delete cascade,
  nome     text not null check (char_length(btrim(nome)) between 1 and 120),
  ativo    boolean not null default true
);
create index if not exists profissionais_por_salao on profissionais (salao_id);

-- Expediente de cada profissional, por dia da semana (0 = domingo).
create table if not exists horarios (
  id              uuid primary key default gen_random_uuid(),
  profissional_id uuid not null references profissionais(id) on delete cascade,
  dia_semana      smallint not null check (dia_semana between 0 and 6),
  abre            time not null,
  fecha           time not null,
  check (fecha > abre)
);
create index if not exists horarios_por_profissional on horarios (profissional_id, dia_semana);

create table if not exists agendamentos (
  id               uuid primary key default gen_random_uuid(),
  salao_id         uuid not null references saloes(id) on delete cascade,
  servico_id       uuid not null references servicos(id) on delete cascade,
  profissional_id  uuid not null references profissionais(id) on delete cascade,
  inicio           timestamptz not null,
  fim              timestamptz not null,
  cliente_nome     text not null check (char_length(btrim(cliente_nome)) between 1 and 120),
  cliente_telefone text not null check (cliente_telefone ~ '^\+[0-9]{12,13}$'),
  status           text not null default 'marcado'
                   check (status in ('marcado', 'confirmado', 'cancelado', 'concluido')),
  criado_em        timestamptz not null default now()
);
create index if not exists agendamentos_por_profissional on agendamentos (profissional_id, inicio);
create index if not exists agendamentos_por_salao on agendamentos (salao_id, inicio);

alter table saloes        enable row level security;
alter table servicos      enable row level security;
alter table profissionais enable row level security;
alter table horarios      enable row level security;
alter table agendamentos  enable row level security;

-- "Quem pergunta é dono deste salão?" SECURITY DEFINER para a policy de uma
-- tabela não depender da policy de outra.
create or replace function e_dono_do_salao(p_salao uuid) returns boolean
language sql stable security definer set search_path from current as $$
  select exists (select 1 from saloes where id = p_salao and dono_id = auth.uid())
$$;

create or replace function e_dono_do_profissional(p_profissional uuid) returns boolean
language sql stable security definer set search_path from current as $$
  select exists (
    select 1 from profissionais p join saloes s on s.id = p.salao_id
     where p.id = p_profissional and s.dono_id = auth.uid()
  )
$$;

drop policy if exists saloes_do_dono on saloes;
create policy saloes_do_dono on saloes for all to authenticated
  using (dono_id = auth.uid()) with check (dono_id = auth.uid());

drop policy if exists servicos_do_dono on servicos;
create policy servicos_do_dono on servicos for all to authenticated
  using (e_dono_do_salao(salao_id)) with check (e_dono_do_salao(salao_id));

drop policy if exists profissionais_do_dono on profissionais;
create policy profissionais_do_dono on profissionais for all to authenticated
  using (e_dono_do_salao(salao_id)) with check (e_dono_do_salao(salao_id));

drop policy if exists horarios_do_dono on horarios;
create policy horarios_do_dono on horarios for all to authenticated
  using (e_dono_do_profissional(profissional_id)) with check (e_dono_do_profissional(profissional_id));

drop policy if exists agendamentos_do_dono on agendamentos;
create policy agendamentos_do_dono on agendamentos for all to authenticated
  using (e_dono_do_salao(salao_id)) with check (e_dono_do_salao(salao_id));

revoke all on saloes, servicos, profissionais, horarios, agendamentos from anon, authenticated;
grant select, insert, update, delete on saloes, servicos, profissionais, horarios, agendamentos to authenticated;

-- Telefone em +55DDDNÚMERO, ou nulo se não for um telefone brasileiro.
create or replace function telefone_normalizado(p text) returns text
language sql immutable set search_path from current as $$
  select case
    when d ~ '^55[1-9][0-9]9?[0-9]{8}$' then '+' || d
    when d ~ '^[1-9][0-9]9?[0-9]{8}$' then '+55' || d
    else null
  end
  from (select regexp_replace(coalesce(p, ''), '[^0-9]', '', 'g') as d) x
$$;

-- O fim sai da duração do serviço, serviço e profissional são do mesmo salão,
-- e dois horários do mesmo profissional não se sobrepõem. Vale para o que o
-- dono lança à mão e para o que chega pela função pública.
create or replace function agendamento_confere() returns trigger
language plpgsql security definer set search_path from current as $$
declare
  v_duracao int;
begin
  if new.status = 'cancelado' then
    return new;
  end if;
  select s.duracao_min into v_duracao from servicos s where s.id = new.servico_id and s.salao_id = new.salao_id;
  if v_duracao is null or not exists (
    select 1 from profissionais p where p.id = new.profissional_id and p.salao_id = new.salao_id
  ) then
    raise exception 'dados_invalidos';
  end if;
  new.fim := new.inicio + make_interval(mins => v_duracao);
  -- Uma marcação por vez para o mesmo profissional: sem a trava, dois pedidos
  -- no mesmo segundo passariam juntos pela conferência.
  perform pg_advisory_xact_lock(hashtext('pocket-agenda'), hashtext(new.profissional_id::text));
  if exists (
    select 1 from agendamentos a
     where a.profissional_id = new.profissional_id and a.id <> new.id and a.status <> 'cancelado'
       and tstzrange(a.inicio, a.fim) && tstzrange(new.inicio, new.fim)
  ) then
    raise exception 'horario_indisponivel';
  end if;
  return new;
end $$;

drop trigger if exists agendamento_confere on agendamentos;
create trigger agendamento_confere
  before insert or update of inicio, servico_id, profissional_id, status on agendamentos
  for each row execute function agendamento_confere();

-- O que a página pública do salão mostra: nome, serviços e profissionais ativos.
create or replace function agenda_publica(p_codigo text) returns jsonb
language sql stable security definer set search_path from current as $$
  select jsonb_build_object(
    'salao', jsonb_build_object('nome', s.nome, 'telefone', s.telefone),
    'servicos', coalesce((select jsonb_agg(jsonb_build_object('id', v.id, 'nome', v.nome,
        'duracao_min', v.duracao_min, 'preco_centavos', v.preco_centavos) order by v.nome)
      from servicos v where v.salao_id = s.id and v.ativo), '[]'::jsonb),
    'profissionais', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'nome', p.nome) order by p.nome)
      from profissionais p where p.salao_id = s.id and p.ativo), '[]'::jsonb)
  )
  from saloes s where s.codigo_publico = p_codigo
$$;

-- Horários livres de um profissional num dia (fuso de Brasília), de meia em
-- meia hora, para um serviço caber inteiro no expediente. Não diz de quem são
-- os horários ocupados.
create or replace function horarios_livres(p_codigo text, p_servico uuid, p_profissional uuid, p_dia date)
returns setof timestamptz
language sql stable security definer set search_path from current as $$
  with alvo as (
    select s.id as salao_id, v.duracao_min
      from saloes s
      join servicos v on v.salao_id = s.id and v.id = p_servico and v.ativo
      join profissionais p on p.salao_id = s.id and p.id = p_profissional and p.ativo
     where s.codigo_publico = p_codigo
  ),
  candidatos as (
    select t at time zone 'America/Sao_Paulo' as inicio, a.duracao_min
      from alvo a
      join horarios h on h.profissional_id = p_profissional and h.dia_semana = extract(dow from p_dia)
      cross join lateral generate_series(p_dia + h.abre, p_dia + h.fecha - make_interval(mins => a.duracao_min),
                                         interval '30 minutes') t
  )
  select c.inicio from candidatos c
   where c.inicio > now()
     and not exists (
       select 1 from agendamentos g
        where g.profissional_id = p_profissional and g.status <> 'cancelado'
          and tstzrange(g.inicio, g.fim) && tstzrange(c.inicio, c.inicio + make_interval(mins => c.duracao_min))
     )
   order by 1
$$;

-- Marca um horário. Recusa com 'dados_invalidos' (nome, telefone, serviço ou
-- profissional de outro salão) ou 'horario_indisponivel' (ocupado, passado ou
-- fora do expediente). Devolve o id do agendamento.
create or replace function agendar(p_codigo text, p_servico uuid, p_profissional uuid, p_inicio timestamptz,
                                   p_nome text, p_telefone text)
returns uuid
language plpgsql volatile security definer set search_path from current as $$
declare
  v_salao uuid;
  v_telefone text := telefone_normalizado(p_telefone);
  v_id uuid;
begin
  select id into v_salao from saloes where codigo_publico = p_codigo;
  if v_salao is null then
    raise exception 'salao_nao_encontrado';
  end if;
  if char_length(btrim(coalesce(p_nome, ''))) not between 1 and 120 or v_telefone is null
     or not exists (select 1 from servicos where id = p_servico and salao_id = v_salao and ativo)
     or not exists (select 1 from profissionais where id = p_profissional and salao_id = v_salao and ativo) then
    raise exception 'dados_invalidos';
  end if;
  perform pg_advisory_xact_lock(hashtext('pocket-agenda'), hashtext(p_profissional::text));
  if p_inicio not in (
    select horarios_livres(p_codigo, p_servico, p_profissional, (p_inicio at time zone 'America/Sao_Paulo')::date)
  ) then
    raise exception 'horario_indisponivel';
  end if;
  insert into agendamentos (salao_id, servico_id, profissional_id, inicio, fim, cliente_nome, cliente_telefone)
  values (v_salao, p_servico, p_profissional, p_inicio, p_inicio, btrim(p_nome), v_telefone)
  returning id into v_id;
  return v_id;
end $$;

revoke all on function e_dono_do_salao(uuid), e_dono_do_profissional(uuid), telefone_normalizado(text),
  agendamento_confere() from public, anon;
grant execute on function e_dono_do_salao(uuid), e_dono_do_profissional(uuid) to authenticated;
revoke all on function agenda_publica(text), horarios_livres(text, uuid, uuid, date),
  agendar(text, uuid, uuid, timestamptz, text, text) from public;
grant execute on function agenda_publica(text), horarios_livres(text, uuid, uuid, date),
  agendar(text, uuid, uuid, timestamptz, text, text) to anon, authenticated;
