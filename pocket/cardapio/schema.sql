-- Pocket · Cardápio com pedido no Pix
--
-- O cliente abre o cardápio pelo link da loja, monta o pedido e paga por Pix
-- estático (o BR Code sai da chave Pix do dono, com o valor do pedido). O pedido
-- fica "aguardando" até o dono conferir o pagamento no banco e confirmar.
-- Nenhum gateway: o dinheiro vai direto para a conta do dono.
--
-- COMO USAR
--   O botão "Usar este modelo" (superdb.com.br/pocket/cardapio) roda este
--   arquivo no seu projeto. À mão: painel do SuperDB > SQL Editor > cole e rode.
--   Pode rodar de novo: nada é duplicado e nenhum dado é apagado.
--
-- SEGURANÇA
--   - RLS em toda tabela. Cada dono só vê e altera a própria loja e os pedidos dela.
--   - A chave anon não lê nem grava tabela nenhuma. O cardápio sai por
--     cardapio_publico(código da loja), o pedido entra por fazer_pedido(), que
--     calcula o total com o preço do banco, e o cliente acompanha o status por
--     pedido_publico(id do pedido), que não mostra nome nem telefone.
--   - Do cliente fica o mínimo: nome, telefone e a observação. O dono apaga o
--     pedido quando quiser.

create table if not exists config_loja (
  id             uuid primary key default gen_random_uuid(),
  dono_id        uuid not null default auth.uid(),
  nome           text not null check (char_length(btrim(nome)) between 1 and 120),
  codigo_publico text not null unique default substr(md5(gen_random_uuid()::text), 1, 16)
                 check (codigo_publico ~ '^[a-z0-9-]{12,40}$'),
  -- A chave e o nome/cidade de quem recebe vão no BR Code (o app normaliza a chave).
  chave_pix      text check (char_length(chave_pix) between 1 and 77),
  nome_recebedor text check (char_length(nome_recebedor) between 1 and 60),
  cidade         text check (char_length(cidade) between 1 and 60),
  aberta         boolean not null default true,
  criado_em      timestamptz not null default now()
);
create index if not exists config_loja_por_dono on config_loja (dono_id);

create table if not exists categorias (
  id      uuid primary key default gen_random_uuid(),
  loja_id uuid not null references config_loja(id) on delete cascade,
  nome    text not null check (char_length(btrim(nome)) between 1 and 80),
  ordem   int  not null default 0
);
create index if not exists categorias_por_loja on categorias (loja_id, ordem);

create table if not exists produtos (
  id             uuid primary key default gen_random_uuid(),
  loja_id        uuid not null references config_loja(id) on delete cascade,
  categoria_id   uuid references categorias(id) on delete set null,
  nome           text not null check (char_length(btrim(nome)) between 1 and 120),
  descricao      text check (char_length(descricao) <= 500),
  preco_centavos int  not null check (preco_centavos > 0),
  -- Endereço público da foto (por exemplo, de um bucket público do Storage do SuperDB).
  foto_url       text check (foto_url ~ '^https://'),
  ativo          boolean not null default true
);
create index if not exists produtos_por_loja on produtos (loja_id);

create table if not exists pedidos (
  id               uuid primary key default gen_random_uuid(),
  loja_id          uuid not null references config_loja(id) on delete cascade,
  cliente_nome     text not null check (char_length(btrim(cliente_nome)) between 1 and 120),
  cliente_telefone text not null check (cliente_telefone ~ '^\+[0-9]{12,13}$'),
  observacao       text check (char_length(observacao) <= 500),
  total_centavos   int  not null check (total_centavos > 0),
  status           text not null default 'aguardando'
                   check (status in ('aguardando', 'confirmado', 'entregue', 'cancelado')),
  criado_em        timestamptz not null default now()
);
create index if not exists pedidos_por_loja on pedidos (loja_id, criado_em desc);

create table if not exists itens_pedido (
  id             uuid primary key default gen_random_uuid(),
  pedido_id      uuid not null references pedidos(id) on delete cascade,
  produto_id     uuid references produtos(id) on delete set null,
  nome           text not null,
  preco_centavos int  not null check (preco_centavos > 0),
  quantidade     int  not null check (quantidade between 1 and 99)
);
create index if not exists itens_por_pedido on itens_pedido (pedido_id);

alter table config_loja  enable row level security;
alter table categorias   enable row level security;
alter table produtos     enable row level security;
alter table pedidos      enable row level security;
alter table itens_pedido enable row level security;

create or replace function e_dono_da_loja(p_loja uuid) returns boolean
language sql stable security definer set search_path from current as $$
  select exists (select 1 from config_loja where id = p_loja and dono_id = auth.uid())
$$;

create or replace function e_dono_do_pedido(p_pedido uuid) returns boolean
language sql stable security definer set search_path from current as $$
  select exists (
    select 1 from pedidos p join config_loja l on l.id = p.loja_id
     where p.id = p_pedido and l.dono_id = auth.uid()
  )
$$;

drop policy if exists config_loja_do_dono on config_loja;
create policy config_loja_do_dono on config_loja for all to authenticated
  using (dono_id = auth.uid()) with check (dono_id = auth.uid());

drop policy if exists categorias_do_dono on categorias;
create policy categorias_do_dono on categorias for all to authenticated
  using (e_dono_da_loja(loja_id)) with check (e_dono_da_loja(loja_id));

drop policy if exists produtos_do_dono on produtos;
create policy produtos_do_dono on produtos for all to authenticated
  using (e_dono_da_loja(loja_id)) with check (e_dono_da_loja(loja_id));

drop policy if exists pedidos_do_dono on pedidos;
create policy pedidos_do_dono on pedidos for all to authenticated
  using (e_dono_da_loja(loja_id)) with check (e_dono_da_loja(loja_id));

drop policy if exists itens_pedido_do_dono on itens_pedido;
create policy itens_pedido_do_dono on itens_pedido for all to authenticated
  using (e_dono_do_pedido(pedido_id)) with check (e_dono_do_pedido(pedido_id));

revoke all on config_loja, categorias, produtos, pedidos, itens_pedido from anon, authenticated;
grant select, insert, update, delete on config_loja, categorias, produtos, pedidos, itens_pedido to authenticated;

create or replace function telefone_normalizado(p text) returns text
language sql immutable set search_path from current as $$
  select case
    when d ~ '^55[1-9][0-9]9?[0-9]{8}$' then '+' || d
    when d ~ '^[1-9][0-9]9?[0-9]{8}$' then '+55' || d
    else null
  end
  from (select regexp_replace(coalesce(p, ''), '[^0-9]', '', 'g') as d) x
$$;

-- O cardápio da página pública: loja, categorias e produtos ativos.
create or replace function cardapio_publico(p_codigo text) returns jsonb
language sql stable security definer set search_path from current as $$
  select jsonb_build_object(
    'loja', jsonb_build_object('nome', l.nome, 'aberta', l.aberta, 'chave_pix', l.chave_pix,
                               'nome_recebedor', l.nome_recebedor, 'cidade', l.cidade),
    'categorias', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'nome', c.nome) order by c.ordem, c.nome)
      from categorias c where c.loja_id = l.id), '[]'::jsonb),
    'produtos', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'categoria_id', p.categoria_id, 'nome', p.nome,
        'descricao', p.descricao, 'preco_centavos', p.preco_centavos, 'foto_url', p.foto_url) order by p.nome)
      from produtos p where p.loja_id = l.id and p.ativo), '[]'::jsonb)
  )
  from config_loja l where l.codigo_publico = p_codigo
$$;

-- Cria o pedido. p_itens = [{"produto_id": "...", "quantidade": 2}, ...]. O
-- preço de cada item é o do banco, nunca o que veio do navegador. Recusa com
-- 'loja_nao_encontrada', 'loja_fechada', 'dados_invalidos' ou 'produto_indisponivel'.
create or replace function fazer_pedido(p_codigo text, p_nome text, p_telefone text, p_observacao text, p_itens jsonb)
returns jsonb
language plpgsql volatile security definer set search_path from current as $$
declare
  v_loja config_loja;
  v_telefone text := telefone_normalizado(p_telefone);
  v_pedido uuid;
  v_total int := 0;
  v_item jsonb;
  v_prod produtos;
  v_qtd int;
begin
  select * into v_loja from config_loja where codigo_publico = p_codigo;
  if v_loja.id is null then
    raise exception 'loja_nao_encontrada';
  end if;
  if not v_loja.aberta then
    raise exception 'loja_fechada';
  end if;
  if char_length(btrim(coalesce(p_nome, ''))) not between 1 and 120 or v_telefone is null
     or char_length(coalesce(p_observacao, '')) > 500
     or jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) not between 1 and 50 then
    raise exception 'dados_invalidos';
  end if;

  insert into pedidos (loja_id, cliente_nome, cliente_telefone, observacao, total_centavos)
  values (v_loja.id, btrim(p_nome), v_telefone, nullif(btrim(coalesce(p_observacao, '')), ''), 1)
  returning id into v_pedido;

  for v_item in select * from jsonb_array_elements(p_itens) loop
    v_qtd := case when jsonb_typeof(v_item->'quantidade') = 'number' then (v_item->>'quantidade')::numeric::int end;
    if v_qtd is null or v_qtd not between 1 and 99 or (v_item->>'quantidade')::numeric <> v_qtd then
      raise exception 'dados_invalidos';
    end if;
    select * into v_prod from produtos
     where id = case when (v_item->>'produto_id') ~ '^[0-9a-f-]{36}$' then (v_item->>'produto_id')::uuid end
       and loja_id = v_loja.id and ativo;
    if v_prod.id is null then
      raise exception 'produto_indisponivel';
    end if;
    insert into itens_pedido (pedido_id, produto_id, nome, preco_centavos, quantidade)
    values (v_pedido, v_prod.id, v_prod.nome, v_prod.preco_centavos, v_qtd);
    v_total := v_total + v_prod.preco_centavos * v_qtd;
  end loop;

  update pedidos set total_centavos = v_total where id = v_pedido;
  return jsonb_build_object('id', v_pedido, 'total_centavos', v_total);
end $$;

-- O que o cliente vê do próprio pedido, pelo id (aleatório) que recebeu ao pedir.
create or replace function pedido_publico(p_id uuid) returns jsonb
language sql stable security definer set search_path from current as $$
  select jsonb_build_object('status', p.status, 'total_centavos', p.total_centavos, 'criado_em', p.criado_em,
    'loja', jsonb_build_object('nome', l.nome, 'chave_pix', l.chave_pix, 'nome_recebedor', l.nome_recebedor, 'cidade', l.cidade),
    'itens', (select jsonb_agg(jsonb_build_object('nome', i.nome, 'quantidade', i.quantidade, 'preco_centavos', i.preco_centavos))
                from itens_pedido i where i.pedido_id = p.id))
  from pedidos p join config_loja l on l.id = p.loja_id
  where p.id = p_id
$$;

revoke all on function e_dono_da_loja(uuid), e_dono_do_pedido(uuid), telefone_normalizado(text) from public, anon;
grant execute on function e_dono_da_loja(uuid), e_dono_do_pedido(uuid) to authenticated;
revoke all on function cardapio_publico(text), fazer_pedido(text, text, text, text, jsonb), pedido_publico(uuid) from public;
grant execute on function cardapio_publico(text), fazer_pedido(text, text, text, text, jsonb), pedido_publico(uuid)
  to anon, authenticated;
