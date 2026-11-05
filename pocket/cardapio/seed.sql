-- Dados de exemplo do Cardápio: uma hamburgueria fictícia (a Brasa & Pão), vista
-- pelo código "exemplo-cardapio-pocket" e FECHADA para pedidos (a mesma em todo
-- projeto que pedir exemplos, e de um dono que não existe: ninguém a abre pelo
-- app). A chave Pix é de exemplo, num domínio reservado (.example) que não
-- recebe Pix. Os pedidos são de nomes inventados, com telefones que terminam em
-- 0000-02xx. A sua loja de verdade você cria no app. Pode rodar de novo.

insert into config_loja (id, dono_id, nome, codigo_publico, chave_pix, nome_recebedor, cidade, aberta)
values ('ca2d0000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-00000000d0e0', 'Brasa & Pão Hamburgueria',
        'exemplo-cardapio-pocket', 'pix@exemplo.example', 'Brasa e Pao Hamburgueria', 'Sao Paulo', false)
on conflict (id) do nothing;

insert into categorias (id, loja_id, nome, ordem) values
  ('ca2d0000-0000-4000-8000-000000000011', 'ca2d0000-0000-4000-8000-000000000001', 'Hambúrgueres', 1),
  ('ca2d0000-0000-4000-8000-000000000012', 'ca2d0000-0000-4000-8000-000000000001', 'Bebidas', 3),
  ('ca2d0000-0000-4000-8000-000000000013', 'ca2d0000-0000-4000-8000-000000000001', 'Acompanhamentos', 2),
  ('ca2d0000-0000-4000-8000-000000000014', 'ca2d0000-0000-4000-8000-000000000001', 'Sobremesas', 4)
on conflict (id) do nothing;

insert into produtos (id, loja_id, categoria_id, nome, descricao, preco_centavos) values
  ('ca2d0000-0000-4000-8000-000000000021', 'ca2d0000-0000-4000-8000-000000000001', 'ca2d0000-0000-4000-8000-000000000011',
   'Clássico da casa', 'Blend de 160 g, queijo prato, alface, tomate e maionese da casa no pão brioche', 3290),
  ('ca2d0000-0000-4000-8000-000000000022', 'ca2d0000-0000-4000-8000-000000000001', 'ca2d0000-0000-4000-8000-000000000011',
   'Brasa bacon', 'Blend de 160 g, cheddar, bacon crocante e cebola caramelizada', 3790),
  ('ca2d0000-0000-4000-8000-000000000024', 'ca2d0000-0000-4000-8000-000000000001', 'ca2d0000-0000-4000-8000-000000000011',
   'Duplo smash', 'Dois smash de 90 g, queijo americano duplo e picles', 3990),
  ('ca2d0000-0000-4000-8000-000000000025', 'ca2d0000-0000-4000-8000-000000000001', 'ca2d0000-0000-4000-8000-000000000011',
   'Veggie de grão-de-bico', 'Hambúrguer de grão-de-bico, rúcula, tomate seco e maionese de ervas', 3190),
  ('ca2d0000-0000-4000-8000-000000000026', 'ca2d0000-0000-4000-8000-000000000001', 'ca2d0000-0000-4000-8000-000000000013',
   'Batata frita rústica', 'Porção de 300 g com páprica e alecrim', 1890),
  ('ca2d0000-0000-4000-8000-000000000027', 'ca2d0000-0000-4000-8000-000000000001', 'ca2d0000-0000-4000-8000-000000000013',
   'Onion rings', 'Anéis de cebola empanados, com molho barbecue', 2190),
  ('ca2d0000-0000-4000-8000-000000000023', 'ca2d0000-0000-4000-8000-000000000001', 'ca2d0000-0000-4000-8000-000000000012',
   'Suco de laranja', '400 ml, feito na hora', 990),
  ('ca2d0000-0000-4000-8000-000000000028', 'ca2d0000-0000-4000-8000-000000000001', 'ca2d0000-0000-4000-8000-000000000012',
   'Refrigerante lata', '350 ml', 690),
  ('ca2d0000-0000-4000-8000-000000000029', 'ca2d0000-0000-4000-8000-000000000001', 'ca2d0000-0000-4000-8000-000000000012',
   'Limonada suíça', '500 ml, com leite condensado', 1290),
  ('ca2d0000-0000-4000-8000-000000000030', 'ca2d0000-0000-4000-8000-000000000001', 'ca2d0000-0000-4000-8000-000000000014',
   'Brownie com sorvete', 'Brownie de chocolate meio amargo e uma bola de creme', 1990)
on conflict (id) do nothing;

-- Pedidos de hoje: o dono confere o Pix no banco e muda o status.
insert into pedidos (id, loja_id, cliente_nome, cliente_telefone, observacao, total_centavos, status, criado_em) values
  ('ca2d0000-0000-4000-8000-000000000041', 'ca2d0000-0000-4000-8000-000000000001', 'Juliana Paiva', '+5511900000201',
   'Sem cebola, por favor', 7080, 'aguardando', now() - interval '6 minutes'),
  ('ca2d0000-0000-4000-8000-000000000042', 'ca2d0000-0000-4000-8000-000000000001', 'Marcos Vieira', '+5511900000202',
   null, 5880, 'confirmado', now() - interval '25 minutes'),
  ('ca2d0000-0000-4000-8000-000000000043', 'ca2d0000-0000-4000-8000-000000000001', 'Tatiane Rezende', '+5511900000203',
   'Retiro no balcão', 3880, 'entregue', now() - interval '1 hour 10 minutes')
on conflict (id) do nothing;

insert into itens_pedido (id, pedido_id, produto_id, nome, preco_centavos, quantidade) values
  ('ca2d0000-0000-4000-8000-000000000051', 'ca2d0000-0000-4000-8000-000000000041', 'ca2d0000-0000-4000-8000-000000000021', 'Clássico da casa', 3290, 1),
  ('ca2d0000-0000-4000-8000-000000000052', 'ca2d0000-0000-4000-8000-000000000041', 'ca2d0000-0000-4000-8000-000000000022', 'Brasa bacon', 3790, 1),
  ('ca2d0000-0000-4000-8000-000000000053', 'ca2d0000-0000-4000-8000-000000000042', 'ca2d0000-0000-4000-8000-000000000024', 'Duplo smash', 3990, 1),
  ('ca2d0000-0000-4000-8000-000000000054', 'ca2d0000-0000-4000-8000-000000000042', 'ca2d0000-0000-4000-8000-000000000026', 'Batata frita rústica', 1890, 1),
  ('ca2d0000-0000-4000-8000-000000000055', 'ca2d0000-0000-4000-8000-000000000043', 'ca2d0000-0000-4000-8000-000000000025', 'Veggie de grão-de-bico', 3190, 1),
  ('ca2d0000-0000-4000-8000-000000000056', 'ca2d0000-0000-4000-8000-000000000043', 'ca2d0000-0000-4000-8000-000000000028', 'Refrigerante lata', 690, 1)
on conflict (id) do nothing;
