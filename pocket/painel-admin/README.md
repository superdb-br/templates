# Painel administrativo · Pocket SuperDB

O esqueleto que todo app interno pede: quem entra, com que papel (admin ou leitor), e telas de listar, buscar,
paginar, criar, editar e apagar sobre as tabelas do seu projeto.

Next.js (App Router) + [`@superdb/client`](https://www.npmjs.com/package/@superdb/client). Licença MIT.

## O que o modelo cria no seu projeto

| Tabela | O que guarda |
|---|---|
| `perfis_admin` | e-mail e papel de cada pessoa da equipe (o convite vale quando ela entrar com esse e-mail) |
| `exemplo_registros` | uma tabela de exemplo, com as policies que o painel espera |

E as funções `papel_no_painel()`, `aceitar_convite_do_painel(token)` e `tabelas_do_painel()`.

**Segurança (RLS):** o painel não usa a service key e não fura o RLS: lê e grava com o token de quem entrou.
Ninguém vira admin sozinho, e um perfil só é assumido com o link do convite (um token) **e** o e-mail convidado:
o e-mail do login, sozinho, não prova que a pessoa é dona dele. A chave anon não lê nada.

## O primeiro admin

No SQL Editor do painel do SuperDB, cadastre o seu e-mail e pegue o token:

```sql
insert into perfis_admin (email, papel) values ('seu@email.com', 'admin') returning convite_token;
```

Depois, no app, entre com esse e-mail e abra `/painel/convite/<token>`. Os próximos você convida pela tela
**Equipe do painel**, que mostra o link de cada convite para mandar à pessoa.

## Mostrar uma tabela sua no painel

Dê a ela policies com `papel_no_painel()`:

```sql
alter table clientes enable row level security;
create policy clientes_painel_le on clientes for select to authenticated
  using (papel_no_painel() is not null);
create policy clientes_painel_grava on clientes for all to authenticated
  using (papel_no_painel() = 'admin') with check (papel_no_painel() = 'admin');
grant select, insert, update, delete on clientes to authenticated;
```

## Rodar local

```bash
npx degit superdb-br/templates/pocket/painel-admin meu-app
cd meu-app && npm install
cp .env.example .env.local   # URL, chave anon e slug (painel do SuperDB, botão "Conectar")
npm run dev
```

As tabelas: use **Usar este modelo** em [superdb.com.br/pocket/painel-admin](https://superdb.com.br/pocket/painel-admin),
ou cole o [`schema.sql`](./schema.sql) no SQL Editor. O [`seed.sql`](./seed.sql) põe registros fictícios na tabela de exemplo.

## Deploy na Vercel

Importe a pasta na Vercel e preencha `NEXT_PUBLIC_SUPERDB_URL`, `NEXT_PUBLIC_SUPERDB_PROJECT` e
`NEXT_PUBLIC_SUPERDB_ANON_KEY` (painel do SuperDB, botão "Conectar"). Se você usa a Integração da Vercel do SuperDB, ligar este
projeto da Vercel ao seu projeto SuperDB nela também preenche as três.

## Quanto custa rodar

Os números de cada plano estão na página do modelo: [superdb.com.br/pocket/painel-admin](https://superdb.com.br/pocket/painel-admin#custo).
