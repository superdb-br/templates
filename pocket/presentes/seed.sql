-- Dados de exemplo da Lista de presentes: a lista fictícia de um casamento,
-- aberta pelo código "exemplo-presentes-pocket", com presentes já escolhidos e
-- recebidos. A chave Pix é de exemplo, num domínio reservado (.example) que não
-- recebe Pix, e os nomes são inventados. A sua lista de verdade você cria no
-- app. Pode rodar de novo.

insert into listas (id, dono_id, titulo, mensagem, chave_pix, nome_recebedor, cidade, codigo_publico)
values ('9e5e0000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-00000000d0e0', 'Casamento da Lara e do Vítor',
        'Obrigado por fazer parte deste dia! Escolha um presente, o Pix vai direto para a nossa conta e a gente fica sabendo quem mandou.',
        'pix@exemplo.example', 'Lara e Vitor', 'Rio de Janeiro', 'exemplo-presentes-pocket')
on conflict (id) do nothing;

insert into itens (id, lista_id, nome, descricao, valor_centavos, status, ordem) values
  ('9e5e0000-0000-4000-8000-0000000000b1', '9e5e0000-0000-4000-8000-0000000000a1', 'Jogo de panelas de inox', '5 peças, fundo triplo', 48000, 'recebido', 1),
  ('9e5e0000-0000-4000-8000-0000000000b2', '9e5e0000-0000-4000-8000-0000000000a1', 'Jantar na lua de mel', 'Para dois, em Paraty', 32000, 'declarado', 2),
  ('9e5e0000-0000-4000-8000-0000000000b3', '9e5e0000-0000-4000-8000-0000000000a1', 'Cafeteira de cápsula', null, 39000, 'disponivel', 3),
  ('9e5e0000-0000-4000-8000-0000000000b4', '9e5e0000-0000-4000-8000-0000000000a1', 'Passeio de barco em Ilha Grande', 'Um dia inteiro, com almoço', 56000, 'disponivel', 4),
  ('9e5e0000-0000-4000-8000-0000000000b5', '9e5e0000-0000-4000-8000-0000000000a1', 'Jogo de cama queen', '400 fios, algodão egípcio', 29000, 'recebido', 5),
  ('9e5e0000-0000-4000-8000-0000000000b6', '9e5e0000-0000-4000-8000-0000000000a1', 'Liquidificador', null, 21000, 'disponivel', 6),
  ('9e5e0000-0000-4000-8000-0000000000b7', '9e5e0000-0000-4000-8000-0000000000a1', 'Cota da lua de mel', 'Ajuda na passagem, qualquer valor conta', 15000, 'disponivel', 7),
  ('9e5e0000-0000-4000-8000-0000000000b8', '9e5e0000-0000-4000-8000-0000000000a1', 'Aula de culinária para dois', null, 26000, 'disponivel', 8)
on conflict (id) do nothing;

insert into contribuicoes (id, item_id, lista_id, nome, recado, criado_em) values
  ('9e5e0000-0000-4000-8000-0000000000c1', '9e5e0000-0000-4000-8000-0000000000b1', '9e5e0000-0000-4000-8000-0000000000a1',
   'Tia Marta', 'Para muitos almoços de domingo!', now() - interval '9 days'),
  ('9e5e0000-0000-4000-8000-0000000000c2', '9e5e0000-0000-4000-8000-0000000000b5', '9e5e0000-0000-4000-8000-0000000000a1',
   'Caio e Fernanda', 'Felicidades ao casal.', now() - interval '6 days'),
  ('9e5e0000-0000-4000-8000-0000000000c3', '9e5e0000-0000-4000-8000-0000000000b2', '9e5e0000-0000-4000-8000-0000000000a1',
   'Turma da faculdade', 'Brindem por nós em Paraty!', now() - interval '1 day')
on conflict (id) do nothing;
