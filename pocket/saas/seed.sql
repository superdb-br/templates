-- Dados de exemplo do SaaS: uma organização fictícia com um dono que não
-- existe (para ver as tabelas cheias no painel do SuperDB). No app, crie a sua.
-- Pode rodar de novo.

insert into organizacoes (id, nome, criado_por)
values ('5aa50000-0000-4000-8000-000000000001', 'Empresa Exemplo', '00000000-0000-4000-8000-00000000d0e0')
on conflict (id) do nothing;

insert into membros (organizacao_id, user_id, email, papel)
values ('5aa50000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-00000000d0e0', 'dono@exemplo.example', 'dono')
on conflict do nothing;

insert into assinaturas (organizacao_id, plano, estado)
values ('5aa50000-0000-4000-8000-000000000001', 'gratis', 'teste')
on conflict do nothing;
