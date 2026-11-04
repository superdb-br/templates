-- Pocket · Confirmação de presença
--
-- O anfitrião cria o evento (data, local) e manda o link. O convidado confirma
-- sem conta: nome, quantas pessoas vão e um recado. O anfitrião vê os totais e
-- baixa a lista em CSV.
--
-- COMO USAR
--   O botão "Usar este modelo" (superdb.com.br/pocket/presenca) roda este
--   arquivo no seu projeto. À mão: painel do SuperDB > SQL Editor > cole e rode.
--   Pode rodar de novo: nada é duplicado e nenhum dado é apagado.
--
-- SEGURANÇA
--   - RLS em toda tabela. Cada anfitrião só vê os próprios eventos e respostas.
--   - A chave anon não lê nem grava tabela nenhuma. O convite sai por
--     evento_publico(código), que não mostra quem já respondeu, e a resposta
--     entra por responder_presenca(). O código tem 16 caracteres aleatórios.
--   - Do convidado fica só o nome, a quantidade e o recado; o anfitrião apaga
--     qualquer resposta quando quiser.

create table if not exists eventos (
  id             uuid primary key default gen_random_uuid(),
  dono_id        uuid not null default auth.uid(),
  titulo         text not null check (char_length(btrim(titulo)) between 1 and 120),
  quando         timestamptz not null,
  local          text check (char_length(local) <= 200),
  descricao      text check (char_length(descricao) <= 1000),
  aceita_respostas boolean not null default true,
  codigo_publico text not null unique default substr(md5(gen_random_uuid()::text), 1, 16)
                 check (codigo_publico ~ '^[a-z0-9-]{12,40}$'),
  criado_em      timestamptz not null default now()
);
create index if not exists eventos_por_dono on eventos (dono_id, quando);

create table if not exists convidados_resposta (
  id         uuid primary key default gen_random_uuid(),
  evento_id  uuid not null references eventos(id) on delete cascade,
  nome       text not null check (char_length(btrim(nome)) between 1 and 120),
  vai        boolean not null,
  quantidade int  not null default 1 check (quantidade between 0 and 20),
  recado     text check (char_length(recado) <= 500),
  criado_em  timestamptz not null default now()
);
create index if not exists respostas_por_evento on convidados_resposta (evento_id, criado_em);

alter table eventos             enable row level security;
alter table convidados_resposta enable row level security;

create or replace function e_dono_do_evento(p_evento uuid) returns boolean
language sql stable security definer set search_path from current as $$
  select exists (select 1 from eventos where id = p_evento and dono_id = auth.uid())
$$;

drop policy if exists eventos_do_dono on eventos;
create policy eventos_do_dono on eventos for all to authenticated
  using (dono_id = auth.uid()) with check (dono_id = auth.uid());

drop policy if exists respostas_do_dono on convidados_resposta;
create policy respostas_do_dono on convidados_resposta for all to authenticated
  using (e_dono_do_evento(evento_id)) with check (e_dono_do_evento(evento_id));

revoke all on eventos, convidados_resposta from anon, authenticated;
grant select, insert, update, delete on eventos, convidados_resposta to authenticated;

-- O convite: título, quando, onde e a descrição. Não diz quem respondeu.
create or replace function evento_publico(p_codigo text) returns jsonb
language sql stable security definer set search_path from current as $$
  select jsonb_build_object('titulo', e.titulo, 'quando', e.quando, 'local', e.local,
                            'descricao', e.descricao, 'aceita_respostas', e.aceita_respostas)
  from eventos e where e.codigo_publico = p_codigo
$$;

-- Grava a resposta do convidado. Quem não vai conta zero pessoas. Recusa com
-- 'evento_nao_encontrado', 'respostas_encerradas' ou 'dados_invalidos'.
create or replace function responder_presenca(p_codigo text, p_nome text, p_vai boolean, p_quantidade int, p_recado text)
returns uuid
language plpgsql volatile security definer set search_path from current as $$
declare
  v_evento eventos;
  v_id uuid;
begin
  select * into v_evento from eventos where codigo_publico = p_codigo;
  if v_evento.id is null then
    raise exception 'evento_nao_encontrado';
  end if;
  if not v_evento.aceita_respostas then
    raise exception 'respostas_encerradas';
  end if;
  if char_length(btrim(coalesce(p_nome, ''))) not between 1 and 120 or p_vai is null
     or (p_vai and coalesce(p_quantidade, 0) not between 1 and 20)
     or char_length(coalesce(p_recado, '')) > 500 then
    raise exception 'dados_invalidos';
  end if;
  insert into convidados_resposta (evento_id, nome, vai, quantidade, recado)
  values (v_evento.id, btrim(p_nome), p_vai, case when p_vai then p_quantidade else 0 end,
          nullif(btrim(coalesce(p_recado, '')), ''))
  returning id into v_id;
  return v_id;
end $$;

revoke all on function e_dono_do_evento(uuid) from public, anon;
grant execute on function e_dono_do_evento(uuid) to authenticated;
revoke all on function evento_publico(text), responder_presenca(text, text, boolean, int, text) from public;
grant execute on function evento_publico(text), responder_presenca(text, text, boolean, int, text) to anon, authenticated;
