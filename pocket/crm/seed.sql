-- Dados de exemplo do CRM: empresas e contatos fictícios de um dono que não
-- existe (para ver as tabelas cheias no painel do SuperDB). No app, cada pessoa
-- começa com o próprio CRM vazio. Pode rodar de novo.

insert into empresas (id, dono_id, nome, site) values
  ('c2a00000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-00000000d0e0', 'Empresa Exemplo Ltda', 'https://exemplo.example')
on conflict (id) do nothing;

insert into contatos (id, dono_id, empresa_id, nome, email) values
  ('c2a00000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-00000000d0e0', 'c2a00000-0000-4000-8000-000000000001',
   'Contato Exemplo', 'contato@exemplo.example')
on conflict (id) do nothing;

insert into etapas (id, dono_id, nome, ordem) values
  ('c2a00000-0000-4000-8000-000000000021', '00000000-0000-4000-8000-00000000d0e0', 'Novo', 1)
on conflict (id) do nothing;

insert into negocios (id, dono_id, titulo, valor_centavos, etapa_id, contato_id, empresa_id) values
  ('c2a00000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-00000000d0e0', 'Contrato anual de exemplo', 1200000,
   'c2a00000-0000-4000-8000-000000000021', 'c2a00000-0000-4000-8000-000000000011', 'c2a00000-0000-4000-8000-000000000001')
on conflict (id) do nothing;
