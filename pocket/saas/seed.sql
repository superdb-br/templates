-- Dados de exemplo do SaaS: uma organização fictícia (um escritório de
-- contabilidade) com dono, admin e membros que não existem, um convite pendente
-- e a assinatura ativa, para ver as tabelas cheias no painel do SuperDB. Os
-- e-mails são de um domínio reservado (.example). No app, crie a sua.
-- Pode rodar de novo.

insert into organizacoes (id, nome, criado_por)
values ('5aa50000-0000-4000-8000-000000000001', 'Contábil Horizonte', '00000000-0000-4000-8000-00000000d0e0')
on conflict (id) do nothing;

insert into membros (organizacao_id, user_id, email, papel) values
  ('5aa50000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-00000000d0e0', 'renata@horizonte.example', 'dono'),
  ('5aa50000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-00000000d0e1', 'paulo@horizonte.example', 'admin'),
  ('5aa50000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-00000000d0e2', 'isabela@horizonte.example', 'membro'),
  ('5aa50000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-00000000d0e3', 'joao.pedro@horizonte.example', 'membro')
on conflict do nothing;

insert into convites (id, organizacao_id, email, papel) values
  ('5aa50000-0000-4000-8000-000000000011', '5aa50000-0000-4000-8000-000000000001', 'estagio@horizonte.example', 'membro')
on conflict do nothing;

insert into assinaturas (organizacao_id, plano, estado, vence_em)
values ('5aa50000-0000-4000-8000-000000000001', 'profissional', 'ativa', now() + interval '23 days')
on conflict do nothing;
