-- Dados de exemplo da Agenda: um salão fictício, aberto pelo código
-- "exemplo-salao-pocket". Nenhum dado de pessoa real. Pode rodar de novo.
-- O dono deste salão é um usuário que não existe: no seu app, crie o seu salão.

insert into saloes (id, dono_id, nome, codigo_publico)
values ('5a10e000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-00000000d0e0', 'Salão Exemplo', 'exemplo-salao-pocket')
on conflict (id) do nothing;

insert into servicos (id, salao_id, nome, duracao_min, preco_centavos) values
  ('5a10e000-0000-4000-8000-000000000011', '5a10e000-0000-4000-8000-000000000001', 'Corte', 30, 5000),
  ('5a10e000-0000-4000-8000-000000000012', '5a10e000-0000-4000-8000-000000000001', 'Escova', 45, 6000),
  ('5a10e000-0000-4000-8000-000000000013', '5a10e000-0000-4000-8000-000000000001', 'Barba', 30, 3500)
on conflict (id) do nothing;

insert into profissionais (id, salao_id, nome) values
  ('5a10e000-0000-4000-8000-000000000021', '5a10e000-0000-4000-8000-000000000001', 'Profissional A'),
  ('5a10e000-0000-4000-8000-000000000022', '5a10e000-0000-4000-8000-000000000001', 'Profissional B')
on conflict (id) do nothing;

insert into horarios (profissional_id, dia_semana, abre, fecha)
select p, d, '09:00', '18:00'
  from unnest(array['5a10e000-0000-4000-8000-000000000021', '5a10e000-0000-4000-8000-000000000022']::uuid[]) p,
       generate_series(1, 6) d
 where not exists (select 1 from horarios h where h.profissional_id = p and h.dia_semana = d);
