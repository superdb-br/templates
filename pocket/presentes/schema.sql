-- Pocket · Lista de presentes com Pix
--
-- O casal (ou o aniversariante) monta a lista com o valor de cada presente. O
-- convidado escolhe um item e paga direto na chave Pix do dono, com o BR Code já
-- com o valor. O item fica "declarado" até o dono ver o dinheiro no banco e
-- marcar como recebido. Nenhum gateway: o dinheiro não passa pelo SuperDB.
--
-- COMO USAR
--   O botão "Usar este modelo" (superdb.com.br/pocket/presentes) roda este
--   arquivo no seu projeto. À mão: painel do SuperDB > SQL Editor > cole e rode.
--   Pode rodar de novo: nada é duplicado e nenhum dado é apagado.
--
-- SEGURANÇA
--   - RLS em toda tabela. Cada dono só vê as próprias listas e quem contribuiu.
--   - A chave anon não lê nem grava tabela nenhuma. A lista sai por
--     lista_publica(código), sem o nome de quem deu cada presente, e a escolha
--     entra por declarar_presente(), que só aceita item disponível daquela lista.
--   - Do convidado fica só o nome e o recado; o dono apaga quando quiser.

create table if not exists listas (
  id             uuid primary key default gen_random_uuid(),
  dono_id        uuid not null default auth.uid(),
  titulo         text not null check (char_length(btrim(titulo)) between 1 and 120),
  mensagem       text check (char_length(mensagem) <= 1000),
  chave_pix      text check (char_length(chave_pix) between 1 and 77),
  nome_recebedor text check (char_length(nome_recebedor) between 1 and 60),
  cidade         text check (char_length(cidade) between 1 and 60),
  codigo_publico text not null unique default substr(md5(gen_random_uuid()::text), 1, 16)
                 check (codigo_publico ~ '^[a-z0-9-]{12,40}$'),
  criado_em      timestamptz not null default now()
);
create index if not exists listas_por_dono on listas (dono_id);

create table if not exists itens (
  id             uuid primary key default gen_random_uuid(),
  lista_id       uuid not null references listas(id) on delete cascade,
  nome           text not null check (char_length(btrim(nome)) between 1 and 120),
  descricao      text check (char_length(descricao) <= 500),
  valor_centavos int  not null check (valor_centavos > 0),
  status         text not null default 'disponivel' check (status in ('disponivel', 'declarado', 'recebido')),
  ordem          int  not null default 0
);
create index if not exists itens_por_lista on itens (lista_id, ordem);

create table if not exists contribuicoes (
  id        uuid primary key default gen_random_uuid(),
  item_id   uuid not null references itens(id) on delete cascade,
  lista_id  uuid not null references listas(id) on delete cascade,
  nome      text not null check (char_length(btrim(nome)) between 1 and 120),
  recado    text check (char_length(recado) <= 500),
  criado_em timestamptz not null default now()
);
create index if not exists contribuicoes_por_lista on contribuicoes (lista_id, criado_em);

alter table listas        enable row level security;
alter table itens         enable row level security;
alter table contribuicoes enable row level security;

create or replace function e_dono_da_lista(p_lista uuid) returns boolean
language sql stable security definer set search_path from current as $$
  select exists (select 1 from listas where id = p_lista and dono_id = auth.uid())
$$;

drop policy if exists listas_do_dono on listas;
create policy listas_do_dono on listas for all to authenticated
  using (dono_id = auth.uid()) with check (dono_id = auth.uid());

drop policy if exists itens_do_dono on itens;
create policy itens_do_dono on itens for all to authenticated
  using (e_dono_da_lista(lista_id)) with check (e_dono_da_lista(lista_id));

drop policy if exists contribuicoes_do_dono on contribuicoes;
create policy contribuicoes_do_dono on contribuicoes for all to authenticated
  using (e_dono_da_lista(lista_id)) with check (e_dono_da_lista(lista_id));

revoke all on listas, itens, contribuicoes from anon, authenticated;
grant select, insert, update, delete on listas, itens, contribuicoes to authenticated;

-- A lista pública: título, mensagem, o Pix de quem recebe e os itens com o
-- status. Não diz quem deu o quê.
create or replace function lista_publica(p_codigo text) returns jsonb
language sql stable security definer set search_path from current as $$
  select jsonb_build_object(
    'lista', jsonb_build_object('titulo', l.titulo, 'mensagem', l.mensagem),
    'pix', jsonb_build_object('chave', l.chave_pix, 'nome', l.nome_recebedor, 'cidade', l.cidade),
    'itens', coalesce((select jsonb_agg(jsonb_build_object('id', i.id, 'nome', i.nome, 'descricao', i.descricao,
        'valor_centavos', i.valor_centavos, 'disponivel', i.status = 'disponivel') order by i.ordem, i.nome)
      from itens i where i.lista_id = l.id), '[]'::jsonb)
  )
  from listas l where l.codigo_publico = p_codigo
$$;

-- O convidado escolhe um item: ele vira "declarado" e a função devolve o que o
-- BR Code precisa (chave, nome, cidade e valor). Recusa com 'lista_nao_encontrada',
-- 'dados_invalidos' ou 'item_indisponivel'.
create or replace function declarar_presente(p_codigo text, p_item uuid, p_nome text, p_recado text)
returns jsonb
language plpgsql volatile security definer set search_path from current as $$
declare
  v_lista listas;
  v_item itens;
begin
  select * into v_lista from listas where codigo_publico = p_codigo;
  if v_lista.id is null then
    raise exception 'lista_nao_encontrada';
  end if;
  if char_length(btrim(coalesce(p_nome, ''))) not between 1 and 120 or char_length(coalesce(p_recado, '')) > 500 then
    raise exception 'dados_invalidos';
  end if;
  -- FOR UPDATE: dois convidados no mesmo segundo não levam o mesmo presente.
  select * into v_item from itens where id = p_item and lista_id = v_lista.id for update;
  if v_item.id is null or v_item.status <> 'disponivel' then
    raise exception 'item_indisponivel';
  end if;
  update itens set status = 'declarado' where id = v_item.id;
  insert into contribuicoes (item_id, lista_id, nome, recado)
  values (v_item.id, v_lista.id, btrim(p_nome), nullif(btrim(coalesce(p_recado, '')), ''));
  return jsonb_build_object('item', v_item.nome, 'valor_centavos', v_item.valor_centavos,
    'chave_pix', v_lista.chave_pix, 'nome_recebedor', v_lista.nome_recebedor, 'cidade', v_lista.cidade);
end $$;

revoke all on function e_dono_da_lista(uuid) from public, anon;
grant execute on function e_dono_da_lista(uuid) to authenticated;
revoke all on function lista_publica(text), declarar_presente(text, uuid, text, text) from public;
grant execute on function lista_publica(text), declarar_presente(text, uuid, text, text) to anon, authenticated;
