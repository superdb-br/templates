-- Dados de exemplo da assistência técnica: clientes, peças, serviços e ordens
-- fictícias em todas as etapas, para ver as telas cheias. Pessoas e empresas são
-- inventadas: cliente pessoa física vem sem CPF (complete no app antes da nota),
-- a empresa usa o CNPJ 00.000.000/0001-91 dos manuais e os e-mails são de um
-- domínio reservado (.example). Pode rodar de novo: nada é duplicado.
--
-- A equipe não vem no exemplo: o primeiro dono é você quem cadastra (ver o
-- schema.sql, "QUEM ENTRA").

insert into clientes (id, nome, documento, telefone, email, endereco) values
  ('a5500000-0000-4000-8000-000000000001', 'Marina Albuquerque', null, '(31) 90000-0401', 'marina@exemplo.example',
   '{"logradouro": "Rua dos Timbiras", "numero": "1200", "bairro": "Centro", "codigo_municipio": "3106200", "cep": "30140060"}'),
  ('a5500000-0000-4000-8000-000000000002', 'Transportes Serra Azul Ltda', '00000000000191', '(31) 90000-0402', 'frota@serraazul.example',
   '{"logradouro": "Avenida do Contorno", "numero": "2000", "bairro": "Funcionários", "codigo_municipio": "3106200", "cep": "30110016"}'),
  ('a5500000-0000-4000-8000-000000000003', 'Henrique Bastos', null, '(31) 90000-0403', null, null),
  ('a5500000-0000-4000-8000-000000000004', 'Luciana Ferraz', null, '(31) 90000-0404', 'luciana@exemplo.example', null)
on conflict (id) do nothing;

insert into catalogo (id, sku, nome, tipo, preco_centavos, estoque, estoque_minimo) values
  ('a5500000-0000-4000-8000-000000000011', 'TELA-A12', 'Tela com touch (Galaxy A12)', 'peca', 18000, 3, 2),
  ('a5500000-0000-4000-8000-000000000012', 'BAT-A12', 'Bateria 5000 mAh (Galaxy A12)', 'peca', 9000, 1, 2),
  ('a5500000-0000-4000-8000-000000000013', 'CONECTOR-USBC', 'Conector de carga USB-C', 'peca', 3500, 10, 3),
  ('a5500000-0000-4000-8000-000000000014', 'TELA-IP11', 'Tela LCD (iPhone 11)', 'peca', 32000, 2, 1),
  ('a5500000-0000-4000-8000-000000000015', 'PELICULA-3D', 'Película de vidro 3D', 'peca', 2500, 24, 10),
  ('a5500000-0000-4000-8000-000000000021', 'MO-TROCA-TELA', 'Mão de obra: troca de tela', 'servico', 9000, 0, 0),
  ('a5500000-0000-4000-8000-000000000022', 'MO-DIAGNOSTICO', 'Diagnóstico', 'servico', 5000, 0, 0),
  ('a5500000-0000-4000-8000-000000000023', 'MO-BATERIA', 'Mão de obra: troca de bateria', 'servico', 6000, 0, 0)
on conflict (id) do nothing;

-- O estoque inicial, registrado como compra (o app faz o mesmo por movimentar_estoque).
insert into movimentos_estoque (id, item_id, quantidade, motivo) values
  ('a5500000-0000-4000-8000-000000000031', 'a5500000-0000-4000-8000-000000000011', 3, 'compra'),
  ('a5500000-0000-4000-8000-000000000032', 'a5500000-0000-4000-8000-000000000012', 1, 'compra'),
  ('a5500000-0000-4000-8000-000000000033', 'a5500000-0000-4000-8000-000000000013', 10, 'compra'),
  ('a5500000-0000-4000-8000-000000000034', 'a5500000-0000-4000-8000-000000000014', 2, 'compra'),
  ('a5500000-0000-4000-8000-000000000035', 'a5500000-0000-4000-8000-000000000015', 24, 'compra')
on conflict (id) do nothing;

insert into ordens_servico (id, cliente_id, equipamento, defeito, status) values
  ('a5500000-0000-4000-8000-000000000041', 'a5500000-0000-4000-8000-000000000001', 'Galaxy A12 preto', 'Tela trincada, toque falhando no canto de baixo', 'pronta'),
  ('a5500000-0000-4000-8000-000000000042', 'a5500000-0000-4000-8000-000000000002', 'Galaxy A12 da frota (placa 07)', 'Não carrega, conector com folga', 'aberta'),
  ('a5500000-0000-4000-8000-000000000043', 'a5500000-0000-4000-8000-000000000003', 'iPhone 11 branco', 'Caiu na água, liga e desliga sozinho', 'em_andamento'),
  ('a5500000-0000-4000-8000-000000000044', 'a5500000-0000-4000-8000-000000000004', 'Galaxy A12 azul', 'Bateria dura menos de meio dia', 'aberta')
on conflict (id) do nothing;

-- O preço sai do catálogo (o gatilho troca o zero pelo preço de tabela).
insert into itens_ordem (id, ordem_id, item_id, quantidade, preco_unitario_centavos) values
  ('a5500000-0000-4000-8000-000000000051', 'a5500000-0000-4000-8000-000000000041', 'a5500000-0000-4000-8000-000000000011', 1, 0),
  ('a5500000-0000-4000-8000-000000000052', 'a5500000-0000-4000-8000-000000000041', 'a5500000-0000-4000-8000-000000000021', 1, 0),
  ('a5500000-0000-4000-8000-000000000053', 'a5500000-0000-4000-8000-000000000042', 'a5500000-0000-4000-8000-000000000022', 1, 0),
  ('a5500000-0000-4000-8000-000000000054', 'a5500000-0000-4000-8000-000000000043', 'a5500000-0000-4000-8000-000000000022', 1, 0),
  ('a5500000-0000-4000-8000-000000000055', 'a5500000-0000-4000-8000-000000000044', 'a5500000-0000-4000-8000-000000000022', 1, 0)
on conflict (id) do nothing;
