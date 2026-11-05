-- Dados de exemplo da Confirmação de presença: uma festa fictícia, aberta pelo
-- código "exemplo-presenca-pocket", daqui a três semanas, com respostas de nomes
-- inventados (quem vai, quem não vai e os recados). Pode rodar de novo.

insert into eventos (id, dono_id, titulo, quando, local, descricao, codigo_publico)
values ('9e5e0000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-00000000d0e0', 'Os 30 anos da Helena',
        ((current_date + 21) + time '20:00') at time zone 'America/Sao_Paulo',
        'Espaço Jardim das Acácias, Rua das Acácias, 120, Belo Horizonte',
        'Vai ter feijoada, roda de samba e bolo de nozes. Traje leve, porque é ao ar livre. Confirme até uma semana antes, por favor!',
        'exemplo-presenca-pocket')
on conflict (id) do nothing;

insert into convidados_resposta (id, evento_id, nome, vai, quantidade, recado, criado_em) values
  ('9e5e0000-0000-4000-8000-000000000011', '9e5e0000-0000-4000-8000-000000000001', 'Rafael e Bruna', true, 2, 'Não perderíamos por nada!', now() - interval '5 days'),
  ('9e5e0000-0000-4000-8000-000000000012', '9e5e0000-0000-4000-8000-000000000001', 'Dona Cida', false, 0, 'Estarei viajando, mas mando um abraço apertado.', now() - interval '4 days'),
  ('9e5e0000-0000-4000-8000-000000000013', '9e5e0000-0000-4000-8000-000000000001', 'Família Couto', true, 4, 'Vamos com as crianças.', now() - interval '4 days'),
  ('9e5e0000-0000-4000-8000-000000000014', '9e5e0000-0000-4000-8000-000000000001', 'Igor Matos', true, 1, null, now() - interval '3 days'),
  ('9e5e0000-0000-4000-8000-000000000015', '9e5e0000-0000-4000-8000-000000000001', 'Larissa Pena', true, 2, 'Levo o violão?', now() - interval '2 days'),
  ('9e5e0000-0000-4000-8000-000000000016', '9e5e0000-0000-4000-8000-000000000001', 'Otávio Reis', false, 0, null, now() - interval '2 days'),
  ('9e5e0000-0000-4000-8000-000000000017', '9e5e0000-0000-4000-8000-000000000001', 'Sabrina e Léo', true, 2, 'Contem com a gente no samba.', now() - interval '1 day'),
  ('9e5e0000-0000-4000-8000-000000000018', '9e5e0000-0000-4000-8000-000000000001', 'Natália Freire', true, 1, 'Parabéns, Helena!', now() - interval '3 hours')
on conflict (id) do nothing;
