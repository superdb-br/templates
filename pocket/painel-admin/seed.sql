-- Dados de exemplo do Painel administrativo: registros fictícios de um
-- escritório (compras, contratos e chamados) para a lista ter o que mostrar, com
-- busca e paginação. Nenhum perfil é criado: o primeiro admin é você quem
-- cadastra no SQL Editor (ver o README). Pode rodar de novo.

insert into exemplo_registros (id, titulo, situacao, valor, criado_em) values
  ('ad300000-0000-4000-8000-000000000001', 'Compra de papel A4 e toner para a recepção', 'aberto', 1250.00, now() - interval '1 day'),
  ('ad300000-0000-4000-8000-000000000002', 'Renovação do contrato de limpeza', 'em andamento', 4800.00, now() - interval '3 days'),
  ('ad300000-0000-4000-8000-000000000003', 'Instalação do ar-condicionado da sala 2', 'fechado', 480.50, now() - interval '12 days'),
  ('ad300000-0000-4000-8000-000000000004', 'Troca dos notebooks do comercial (4 unidades)', 'em andamento', 18960.00, now() - interval '2 days'),
  ('ad300000-0000-4000-8000-000000000005', 'Chamado: impressora do financeiro sem rede', 'aberto', null, now() - interval '5 hours'),
  ('ad300000-0000-4000-8000-000000000006', 'Assinatura anual do sistema de ponto', 'fechado', 2390.00, now() - interval '20 days'),
  ('ad300000-0000-4000-8000-000000000007', 'Cadeiras ergonômicas para o atendimento', 'aberto', 6400.00, now() - interval '4 days'),
  ('ad300000-0000-4000-8000-000000000008', 'Manutenção preventiva do gerador', 'fechado', 950.00, now() - interval '30 days'),
  ('ad300000-0000-4000-8000-000000000009', 'Coffee break do treinamento de vendas', 'em andamento', 720.00, now() - interval '1 day'),
  ('ad300000-0000-4000-8000-000000000010', 'Revisão do contrato de aluguel da filial', 'aberto', null, now() - interval '6 days')
on conflict (id) do nothing;
