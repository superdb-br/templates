-- Dados de exemplo da Agenda: um salão fictício (o Studio Lumi), aberto pelo
-- código "exemplo-salao-pocket", com serviços, três profissionais, expediente
-- de segunda a sábado e a agenda de hoje e de amanhã já com clientes.
-- Nomes e telefones são inventados (os telefones terminam em 0000-01xx, de
-- propósito). Pode rodar de novo: nada é duplicado.
-- O dono deste salão é um usuário que não existe: no seu app, crie o seu salão.

insert into saloes (id, dono_id, nome, telefone, codigo_publico)
values ('5a10e000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-00000000d0e0', 'Studio Lumi Cabelo e Barba',
        '+5511900000100', 'exemplo-salao-pocket')
on conflict (id) do nothing;

insert into servicos (id, salao_id, nome, duracao_min, preco_centavos) values
  ('5a10e000-0000-4000-8000-000000000011', '5a10e000-0000-4000-8000-000000000001', 'Corte masculino', 30, 4500),
  ('5a10e000-0000-4000-8000-000000000012', '5a10e000-0000-4000-8000-000000000001', 'Escova modelada', 45, 6500),
  ('5a10e000-0000-4000-8000-000000000013', '5a10e000-0000-4000-8000-000000000001', 'Barba na navalha', 30, 3800),
  ('5a10e000-0000-4000-8000-000000000014', '5a10e000-0000-4000-8000-000000000001', 'Corte feminino', 60, 9000),
  ('5a10e000-0000-4000-8000-000000000015', '5a10e000-0000-4000-8000-000000000001', 'Coloração', 120, 22000),
  ('5a10e000-0000-4000-8000-000000000016', '5a10e000-0000-4000-8000-000000000001', 'Hidratação', 45, 8000),
  ('5a10e000-0000-4000-8000-000000000017', '5a10e000-0000-4000-8000-000000000001', 'Corte e barba', 60, 7500)
on conflict (id) do nothing;

insert into profissionais (id, salao_id, nome) values
  ('5a10e000-0000-4000-8000-000000000021', '5a10e000-0000-4000-8000-000000000001', 'Carla Mendes'),
  ('5a10e000-0000-4000-8000-000000000022', '5a10e000-0000-4000-8000-000000000001', 'Diego Rocha'),
  ('5a10e000-0000-4000-8000-000000000023', '5a10e000-0000-4000-8000-000000000001', 'Paula Nunes')
on conflict (id) do nothing;

-- Segunda a sábado, das 9h às 19h (no sábado, até as 15h).
insert into horarios (profissional_id, dia_semana, abre, fecha)
select p, d, '09:00', case when d = 6 then time '15:00' else time '19:00' end
  from unnest(array['5a10e000-0000-4000-8000-000000000021', '5a10e000-0000-4000-8000-000000000022',
                    '5a10e000-0000-4000-8000-000000000023']::uuid[]) p,
       generate_series(1, 6) d
 where not exists (select 1 from horarios h where h.profissional_id = p and h.dia_semana = d);

-- A agenda de hoje e de amanhã, no horário de Brasília. O fim é o início mais a
-- duração do serviço (o gatilho confere a mesma conta e recusa dois clientes no
-- mesmo horário; o cancelado passa direto por ele, por isso o fim vai aqui).
insert into agendamentos (id, salao_id, servico_id, profissional_id, inicio, fim, cliente_nome, cliente_telefone, status)
select a.id::uuid, '5a10e000-0000-4000-8000-000000000001', a.servico::uuid, a.profissional::uuid,
       ((current_date + a.dia) + a.hora::time) at time zone 'America/Sao_Paulo',
       ((current_date + a.dia) + a.hora::time) at time zone 'America/Sao_Paulo' + make_interval(mins => s.duracao_min),
       a.nome, a.telefone, a.status
  from (values
    ('5a10e000-0000-4000-8000-000000000031', '5a10e000-0000-4000-8000-000000000014', '5a10e000-0000-4000-8000-000000000021', 0, '09:00', 'Mariana Prado',    '+5511900000101', 'concluido'),
    ('5a10e000-0000-4000-8000-000000000032', '5a10e000-0000-4000-8000-000000000017', '5a10e000-0000-4000-8000-000000000022', 0, '09:30', 'Lucas Teixeira',   '+5511900000102', 'concluido'),
    ('5a10e000-0000-4000-8000-000000000033', '5a10e000-0000-4000-8000-000000000015', '5a10e000-0000-4000-8000-000000000023', 0, '10:00', 'Beatriz Couto',    '+5511900000103', 'confirmado'),
    ('5a10e000-0000-4000-8000-000000000034', '5a10e000-0000-4000-8000-000000000011', '5a10e000-0000-4000-8000-000000000022', 0, '11:00', 'Rodrigo Almeida',  '+5511900000104', 'confirmado'),
    ('5a10e000-0000-4000-8000-000000000035', '5a10e000-0000-4000-8000-000000000012', '5a10e000-0000-4000-8000-000000000021', 0, '13:30', 'Camila Furtado',   '+5511900000105', 'marcado'),
    ('5a10e000-0000-4000-8000-000000000036', '5a10e000-0000-4000-8000-000000000013', '5a10e000-0000-4000-8000-000000000022', 0, '14:00', 'Thiago Barros',    '+5511900000106', 'marcado'),
    ('5a10e000-0000-4000-8000-000000000037', '5a10e000-0000-4000-8000-000000000016', '5a10e000-0000-4000-8000-000000000023', 0, '15:30', 'Renata Siqueira',  '+5511900000107', 'marcado'),
    ('5a10e000-0000-4000-8000-000000000038', '5a10e000-0000-4000-8000-000000000011', '5a10e000-0000-4000-8000-000000000022', 0, '17:00', 'Gustavo Lacerda',  '+5511900000108', 'cancelado'),
    ('5a10e000-0000-4000-8000-000000000039', '5a10e000-0000-4000-8000-000000000014', '5a10e000-0000-4000-8000-000000000021', 1, '10:00', 'Aline Moura',      '+5511900000109', 'marcado'),
    ('5a10e000-0000-4000-8000-000000000040', '5a10e000-0000-4000-8000-000000000017', '5a10e000-0000-4000-8000-000000000022', 1, '16:00', 'Henrique Andrade', '+5511900000110', 'confirmado')
  ) as a(id, servico, profissional, dia, hora, nome, telefone, status)
 join servicos s on s.id = a.servico::uuid
 where not exists (select 1 from agendamentos x where x.id = a.id::uuid);
