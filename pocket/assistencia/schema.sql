-- Pocket · Assistência técnica com nota (modelo Pro)
--
-- O balcão de uma assistência técnica: clientes, peças e serviços com preço de
-- tabela, ordens de serviço (aberta, em andamento, pronta, entregue) e o estoque
-- das peças. Ao entregar a ordem, o app emite a NFS-e da mão de obra pelo
-- SuperDB Fiscal (abaixo do plano Pro, em homologação: nota de teste, sem valor
-- fiscal).
--
-- COMO USAR
--   O botão "Usar este modelo" (superdb.com.br/pocket/assistencia) roda este
--   arquivo no seu projeto. À mão: painel do SuperDB > SQL Editor > cole e rode.
--   Pode rodar de novo: nada é duplicado e nenhum dado é apagado.
--
-- QUEM ENTRA
--   O app é da equipe da loja; o cliente da loja não tem login. Ninguém entra na
--   equipe sozinho: o primeiro dono é cadastrado por você, dono do projeto, no
--   SQL Editor (o app mostra o id de quem entrou):
--     insert into equipe (user_id, nome, papel) values ('<id>', 'Seu nome', 'dono');
--   Depois, o dono põe atendentes e técnicos pela tela Equipe do app.
--
-- O QUE O BANCO GARANTE (não o app)
--   - RLS em toda tabela: quem não é da equipe não vê nada; a chave anon, também não.
--   - O preço do item vem do catálogo, nunca do que o app mandou.
--   - O estoque nunca fica negativo: a coluna tem CHECK e a entrega baixa as peças
--     numa transação só. Faltou uma peça, nada baixa e a ordem continua aberta.
--   - Ninguém mexe no estoque direto: só pelas funções, e cada movimento fica
--     registrado. Só o dono muda preço e lança compra.
--   - Ordem entregue ou cancelada não muda mais (nem itens, nem status).
--   - A NFS-e é emitida pelo SERVIDOR do app com a chave de serviço; a nota não
--     passa pelo navegador.

create table if not exists equipe (
  user_id   uuid primary key,
  nome      text not null check (char_length(btrim(nome)) between 1 and 120),
  papel     text not null default 'atendente' check (papel in ('dono', 'atendente', 'tecnico')),
  criado_em timestamptz not null default now()
);

create table if not exists clientes (
  id        uuid primary key default gen_random_uuid(),
  nome      text not null check (char_length(btrim(nome)) between 1 and 200),
  -- CPF (11) ou CNPJ (14), só dígitos. A NFS-e pede um dos dois.
  documento text check (documento ~ '^([0-9]{11}|[0-9]{14})$'),
  telefone  text check (char_length(telefone) <= 30),
  email     text check (char_length(email) <= 200),
  -- O endereço da NFS-e: { logradouro, numero, bairro, codigo_municipio (IBGE, 7 dígitos), cep (8 dígitos) }.
  endereco  jsonb check (endereco is null or jsonb_typeof(endereco) = 'object'),
  criado_em timestamptz not null default now()
);
create index if not exists clientes_por_nome on clientes (nome);

-- Peça tem estoque; serviço (mão de obra) não. O preço é o de tabela.
create table if not exists catalogo (
  id             uuid primary key default gen_random_uuid(),
  sku            text not null unique check (char_length(btrim(sku)) between 1 and 40),
  nome           text not null check (char_length(btrim(nome)) between 1 and 160),
  tipo           text not null check (tipo in ('peca', 'servico')),
  preco_centavos bigint not null check (preco_centavos >= 0),
  estoque        int not null default 0 check (estoque >= 0),
  estoque_minimo int not null default 0 check (estoque_minimo >= 0),
  check (tipo = 'peca' or estoque = 0)
);

create table if not exists ordens_servico (
  id                      uuid primary key default gen_random_uuid(),
  -- O número que o cliente vê no balcão e a referência da nota (os-<numero>).
  numero                  bigint generated always as identity unique,
  cliente_id              uuid not null references clientes(id) on delete restrict,
  equipamento             text not null check (char_length(btrim(equipamento)) between 1 and 200),
  defeito                 text not null check (char_length(btrim(defeito)) between 1 and 2000),
  status                  text not null default 'aberta'
                          check (status in ('aberta', 'em_andamento', 'pronta', 'entregue', 'cancelada')),
  total_pecas_centavos    bigint not null default 0 check (total_pecas_centavos >= 0),
  total_servicos_centavos bigint not null default 0 check (total_servicos_centavos >= 0),
  -- A NFS-e da mão de obra, gravada pelo servidor do app (chave de serviço).
  nfse_id                 uuid,
  nfse_situacao           text,
  nfse_ambiente           text check (nfse_ambiente in ('homologacao', 'producao')),
  nfse_numero             text,
  aberta_por              uuid default auth.uid(),
  aberta_em               timestamptz not null default now(),
  entregue_em             timestamptz
);
create index if not exists ordens_por_status on ordens_servico (status, aberta_em desc);

create table if not exists itens_ordem (
  id                      uuid primary key default gen_random_uuid(),
  ordem_id                uuid not null references ordens_servico(id) on delete cascade,
  item_id                 uuid not null references catalogo(id) on delete restrict,
  quantidade              int not null check (quantidade between 1 and 999),
  preco_unitario_centavos bigint not null default 0 check (preco_unitario_centavos >= 0)
);
create index if not exists itens_por_ordem on itens_ordem (ordem_id);

-- Toda entrada e saída de peça. Ninguém escreve direto aqui: só as funções.
create table if not exists movimentos_estoque (
  id         uuid primary key default gen_random_uuid(),
  item_id    uuid not null references catalogo(id) on delete restrict,
  quantidade int not null check (quantidade <> 0), -- positivo entra, negativo sai
  motivo     text not null check (motivo in ('compra', 'ordem', 'ajuste')),
  ordem_id   uuid references ordens_servico(id) on delete set null,
  feito_por  uuid default auth.uid(),
  feito_em   timestamptz not null default now()
);
create index if not exists movimentos_por_item on movimentos_estoque (item_id, feito_em desc);

alter table equipe             enable row level security;
alter table clientes           enable row level security;
alter table catalogo           enable row level security;
alter table ordens_servico     enable row level security;
alter table itens_ordem        enable row level security;
alter table movimentos_estoque enable row level security;

-- Quem pergunta é da equipe (com este papel, se pedido)?
create or replace function e_da_equipe(p_papel text default null) returns boolean
language sql stable security definer set search_path from current as $$
  select exists (
    select 1 from equipe
     where user_id = auth.uid() and (p_papel is null or papel = p_papel)
  )
$$;

-- O preço do item vem do catálogo; ordem fechada não ganha, muda nem perde item.
create or replace function itens_da_ordem_guarda() returns trigger
language plpgsql security definer set search_path from current as $$
declare
  v_ordem uuid := case when tg_op = 'DELETE' then old.ordem_id else new.ordem_id end;
begin
  if exists (select 1 from ordens_servico o where o.id = v_ordem and o.status in ('entregue', 'cancelada')) then
    raise exception 'ordem_fechada';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  select c.preco_centavos into new.preco_unitario_centavos from catalogo c where c.id = new.item_id;
  return new;
end $$;
drop trigger if exists itens_da_ordem_guarda on itens_ordem;
create trigger itens_da_ordem_guarda before insert or update or delete on itens_ordem
  for each row execute function itens_da_ordem_guarda();

-- Ordem entregue ou cancelada não muda mais. Só a NFS-e (gravada pelo servidor) anda.
create or replace function ordem_fechada_nao_muda() returns trigger
language plpgsql set search_path from current as $$
begin
  if old.status in ('entregue', 'cancelada')
     and (new.status, new.cliente_id, new.equipamento, new.defeito, new.total_pecas_centavos,
          new.total_servicos_centavos, new.entregue_em)
         is distinct from
         (old.status, old.cliente_id, old.equipamento, old.defeito, old.total_pecas_centavos,
          old.total_servicos_centavos, old.entregue_em) then
    raise exception 'ordem_fechada';
  end if;
  return new;
end $$;
drop trigger if exists ordem_fechada_nao_muda on ordens_servico;
create trigger ordem_fechada_nao_muda before update on ordens_servico
  for each row execute function ordem_fechada_nao_muda();

-- Equipe: cada um vê a própria linha; o dono vê todas e põe ou tira gente
-- (menos a si mesmo, para a loja nunca ficar sem dono).
drop policy if exists equipe_ver on equipe;
create policy equipe_ver on equipe for select to authenticated
  using (user_id = auth.uid() or e_da_equipe('dono'));
drop policy if exists equipe_dono_poe on equipe;
create policy equipe_dono_poe on equipe for insert to authenticated
  with check (e_da_equipe('dono'));
drop policy if exists equipe_dono_muda on equipe;
create policy equipe_dono_muda on equipe for update to authenticated
  using (e_da_equipe('dono') and user_id <> auth.uid()) with check (e_da_equipe('dono'));
drop policy if exists equipe_dono_tira on equipe;
create policy equipe_dono_tira on equipe for delete to authenticated
  using (e_da_equipe('dono') and user_id <> auth.uid());

-- Clientes: toda a equipe lê e grava.
drop policy if exists clientes_equipe on clientes;
create policy clientes_equipe on clientes for all to authenticated
  using (e_da_equipe()) with check (e_da_equipe());

-- Catálogo: a equipe lê; só o dono cadastra e muda preço.
drop policy if exists catalogo_ler on catalogo;
create policy catalogo_ler on catalogo for select to authenticated
  using (e_da_equipe());
drop policy if exists catalogo_dono_cadastra on catalogo;
create policy catalogo_dono_cadastra on catalogo for insert to authenticated
  with check (e_da_equipe('dono'));
drop policy if exists catalogo_dono_muda on catalogo;
create policy catalogo_dono_muda on catalogo for update to authenticated
  using (e_da_equipe('dono')) with check (e_da_equipe('dono'));

-- Ordens e itens: toda a equipe. O status anda pelas funções.
drop policy if exists ordens_equipe on ordens_servico;
create policy ordens_equipe on ordens_servico for all to authenticated
  using (e_da_equipe()) with check (e_da_equipe());
drop policy if exists itens_equipe on itens_ordem;
create policy itens_equipe on itens_ordem for all to authenticated
  using (e_da_equipe()) with check (e_da_equipe());

-- Movimentos: a equipe lê; ninguém escreve direto.
drop policy if exists movimentos_ler on movimentos_estoque;
create policy movimentos_ler on movimentos_estoque for select to authenticated
  using (e_da_equipe());

revoke all on equipe, clientes, catalogo, ordens_servico, itens_ordem, movimentos_estoque from anon, authenticated;
grant select, insert, delete on equipe to authenticated;
grant update (nome, papel) on equipe to authenticated;
grant select, insert, update on clientes to authenticated;
grant select on catalogo to authenticated;
grant insert (sku, nome, tipo, preco_centavos, estoque_minimo) on catalogo to authenticated;
grant update (sku, nome, tipo, preco_centavos, estoque_minimo) on catalogo to authenticated;
grant select on ordens_servico to authenticated;
grant insert (cliente_id, equipamento, defeito) on ordens_servico to authenticated;
grant update (equipamento, defeito) on ordens_servico to authenticated;
grant select, insert, delete on itens_ordem to authenticated;
grant update (quantidade) on itens_ordem to authenticated;
grant select on movimentos_estoque to authenticated;

-- O status antes da entrega (aberta, em andamento, pronta) ou cancelar. A
-- entrega é só por entregar_ordem, que baixa o estoque.
create or replace function mudar_status_ordem(p_ordem uuid, p_status text)
returns text
language plpgsql security definer set search_path from current as $$
begin
  if not e_da_equipe() then
    raise exception 'so_a_equipe';
  end if;
  if p_status not in ('aberta', 'em_andamento', 'pronta', 'cancelada') then
    raise exception 'status_invalido';
  end if;
  update ordens_servico set status = p_status
   where id = p_ordem and status not in ('entregue', 'cancelada');
  if not found then
    raise exception 'ordem_nao_encontrada_ou_fechada';
  end if;
  return p_status;
end $$;

-- Entrada de compra ou ajuste de inventário: só o dono. O CHECK da coluna
-- recusa o ajuste que deixaria o estoque negativo.
create or replace function movimentar_estoque(p_item uuid, p_quantidade int, p_motivo text)
returns int
language plpgsql security definer set search_path from current as $$
declare
  v_novo int;
begin
  if not e_da_equipe('dono') then
    raise exception 'so_o_dono_movimenta_estoque';
  end if;
  if p_motivo not in ('compra', 'ajuste') or p_quantidade is null or p_quantidade = 0
     or (p_motivo = 'compra' and p_quantidade < 0) then
    raise exception 'movimento_invalido';
  end if;
  update catalogo set estoque = estoque + p_quantidade
   where id = p_item and tipo = 'peca'
  returning estoque into v_novo;
  if v_novo is null then
    raise exception 'peca_nao_encontrada';
  end if;
  insert into movimentos_estoque (item_id, quantidade, motivo) values (p_item, p_quantidade, p_motivo);
  return v_novo;
end $$;

-- Entregar a ordem: baixa as peças, soma os totais e fecha, numa transação.
-- Faltou peça: nada baixa e a ordem continua como estava.
create or replace function entregar_ordem(p_ordem uuid)
returns ordens_servico
language plpgsql security definer set search_path from current as $$
declare
  v_item record;
  v_resultado ordens_servico;
begin
  if not e_da_equipe() then
    raise exception 'so_a_equipe';
  end if;
  perform 1 from ordens_servico where id = p_ordem and status not in ('entregue', 'cancelada') for update;
  if not found then
    raise exception 'ordem_nao_encontrada_ou_fechada';
  end if;
  for v_item in
    select i.item_id, sum(i.quantidade)::int as quantidade, c.sku
      from itens_ordem i join catalogo c on c.id = i.item_id
     where i.ordem_id = p_ordem and c.tipo = 'peca'
     group by i.item_id, c.sku
     order by i.item_id
  loop
    update catalogo set estoque = estoque - v_item.quantidade
     where id = v_item.item_id and estoque >= v_item.quantidade;
    if not found then
      raise exception 'estoque_insuficiente: %', v_item.sku;
    end if;
    insert into movimentos_estoque (item_id, quantidade, motivo, ordem_id)
    values (v_item.item_id, -v_item.quantidade, 'ordem', p_ordem);
  end loop;
  update ordens_servico o set
    status = 'entregue',
    entregue_em = now(),
    total_pecas_centavos = coalesce((select sum(i.quantidade * i.preco_unitario_centavos) from itens_ordem i
                                       join catalogo c on c.id = i.item_id
                                      where i.ordem_id = p_ordem and c.tipo = 'peca'), 0),
    total_servicos_centavos = coalesce((select sum(i.quantidade * i.preco_unitario_centavos) from itens_ordem i
                                          join catalogo c on c.id = i.item_id
                                         where i.ordem_id = p_ordem and c.tipo = 'servico'), 0)
   where o.id = p_ordem
  returning o.* into v_resultado;
  return v_resultado;
end $$;

revoke all on function e_da_equipe(text) from public, anon;
revoke all on function mudar_status_ordem(uuid, text) from public, anon;
revoke all on function movimentar_estoque(uuid, int, text) from public, anon;
revoke all on function entregar_ordem(uuid) from public, anon;
grant execute on function e_da_equipe(text) to authenticated;
grant execute on function mudar_status_ordem(uuid, text) to authenticated;
grant execute on function movimentar_estoque(uuid, int, text) to authenticated;
grant execute on function entregar_ordem(uuid) to authenticated;

-- O que precisa comprar. security_invoker: a view respeita a RLS de quem lê.
create or replace view estoque_baixo with (security_invoker = true) as
  select id, sku, nome, estoque, estoque_minimo
    from catalogo
   where tipo = 'peca' and estoque <= estoque_minimo;
revoke all on estoque_baixo from anon, authenticated;
grant select on estoque_baixo to authenticated;
