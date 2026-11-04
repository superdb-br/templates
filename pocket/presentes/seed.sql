-- Dados de exemplo da Lista de presentes: uma lista fictícia, aberta pelo
-- código "exemplo-presentes-pocket". A chave Pix é de exemplo, num domínio
-- reservado (.example) que não recebe Pix. A sua lista de verdade você cria no
-- app. Pode rodar de novo.

insert into listas (id, dono_id, titulo, mensagem, chave_pix, nome_recebedor, cidade, codigo_publico)
values ('9e5e0000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-00000000d0e0', 'Casamento de exemplo',
        'Obrigado por fazer parte deste dia!', 'pix@exemplo.example', 'Casal Exemplo', 'Rio de Janeiro', 'exemplo-presentes-pocket')
on conflict (id) do nothing;

insert into itens (id, lista_id, nome, descricao, valor_centavos, ordem) values
  ('9e5e0000-0000-4000-8000-0000000000b1', '9e5e0000-0000-4000-8000-0000000000a1', 'Jogo de panelas', null, 35000, 1),
  ('9e5e0000-0000-4000-8000-0000000000b2', '9e5e0000-0000-4000-8000-0000000000a1', 'Jantar na lua de mel', 'Para dois', 25000, 2),
  ('9e5e0000-0000-4000-8000-0000000000b3', '9e5e0000-0000-4000-8000-0000000000a1', 'Cafeteira', null, 18000, 3)
on conflict (id) do nothing;
