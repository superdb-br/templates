-- Dados de exemplo da Confirmação de presença: um evento fictício, aberto pelo
-- código "exemplo-presenca-pocket", com duas respostas de nomes inventados.
-- Pode rodar de novo.

insert into eventos (id, dono_id, titulo, quando, local, descricao, codigo_publico)
values ('9e5e0000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-00000000d0e0', 'Aniversário de exemplo',
        now() + interval '30 days', 'Salão de festas do prédio', 'Traga sua alegria!', 'exemplo-presenca-pocket')
on conflict (id) do nothing;

insert into convidados_resposta (id, evento_id, nome, vai, quantidade, recado) values
  ('9e5e0000-0000-4000-8000-000000000011', '9e5e0000-0000-4000-8000-000000000001', 'Convidado A', true, 2, 'Estaremos lá!'),
  ('9e5e0000-0000-4000-8000-000000000012', '9e5e0000-0000-4000-8000-000000000001', 'Convidada B', false, 0, null)
on conflict (id) do nothing;
