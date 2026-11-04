-- Dados de exemplo do Cardápio: uma loja fictícia, vista pelo código
-- "exemplo-cardapio-pocket" e FECHADA para pedidos (a mesma em todo projeto que
-- pedir exemplos, e de um dono que não existe: ninguém a abre pelo app). A
-- chave Pix é de exemplo, num domínio reservado (.example) que não recebe Pix.
-- A sua loja de verdade você cria no app. Pode rodar de novo.

insert into config_loja (id, dono_id, nome, codigo_publico, chave_pix, nome_recebedor, cidade, aberta)
values ('ca2d0000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-00000000d0e0', 'Lanchonete Exemplo',
        'exemplo-cardapio-pocket', 'pix@exemplo.example', 'Lanchonete Exemplo', 'Sao Paulo', false)
on conflict (id) do nothing;

insert into categorias (id, loja_id, nome, ordem) values
  ('ca2d0000-0000-4000-8000-000000000011', 'ca2d0000-0000-4000-8000-000000000001', 'Lanches', 1),
  ('ca2d0000-0000-4000-8000-000000000012', 'ca2d0000-0000-4000-8000-000000000001', 'Bebidas', 2)
on conflict (id) do nothing;

insert into produtos (id, loja_id, categoria_id, nome, descricao, preco_centavos) values
  ('ca2d0000-0000-4000-8000-000000000021', 'ca2d0000-0000-4000-8000-000000000001', 'ca2d0000-0000-4000-8000-000000000011',
   'X-Salada', 'Pão, hambúrguer, queijo, alface e tomate', 2500),
  ('ca2d0000-0000-4000-8000-000000000022', 'ca2d0000-0000-4000-8000-000000000001', 'ca2d0000-0000-4000-8000-000000000011',
   'Misto quente', 'Pão de forma, presunto e queijo', 1200),
  ('ca2d0000-0000-4000-8000-000000000023', 'ca2d0000-0000-4000-8000-000000000001', 'ca2d0000-0000-4000-8000-000000000012',
   'Suco de laranja', '400 ml', 900)
on conflict (id) do nothing;
