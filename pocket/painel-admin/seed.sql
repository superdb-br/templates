-- Dados de exemplo do Painel administrativo: registros fictícios para a lista
-- ter o que mostrar. Nenhum perfil é criado: o primeiro admin é você quem
-- cadastra no SQL Editor (ver o README). Pode rodar de novo.

insert into exemplo_registros (id, titulo, situacao, valor) values
  ('ad300000-0000-4000-8000-000000000001', 'Pedido de compra de material', 'aberto', 1250.00),
  ('ad300000-0000-4000-8000-000000000002', 'Revisão do contrato de exemplo', 'em andamento', null),
  ('ad300000-0000-4000-8000-000000000003', 'Instalação concluída', 'fechado', 480.50)
on conflict (id) do nothing;
