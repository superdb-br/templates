# SaaS com organizações e assinatura · Pocket SuperDB

A base de todo SaaS multiempresa: organizações, membros com papel (dono, admin, membro), convites por link e o
estado da assinatura de cada organização. O RLS separa os dados por organização.

Next.js (App Router) + [`@superdb/client`](https://www.npmjs.com/package/@superdb/client). Licença MIT.

## O que o modelo cria no seu projeto

| Tabela | O que guarda |
|---|---|
| `organizacoes` | nome e quem criou |
| `membros` | quem é de cada organização e com que papel |
| `convites` | e-mail convidado, papel, token e validade (7 dias) |
| `assinaturas` | plano, estado (teste, ativa, atrasada, cancelada) e vencimento |

E as funções `papel_na_org(org)`, `criar_organizacao(nome)` e `aceitar_convite(token)`.

**Segurança (RLS):** quem não é membro não vê nada da organização. Ninguém se põe como membro à mão: só criando
a organização ou aceitando um convite feito para o próprio e-mail. Membro comum não convida nem muda papel.
A chave anon não lê nada.

## Suas tabelas, separadas por organização

```sql
create table projetos (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references organizacoes(id) on delete cascade,
  nome text not null
);
alter table projetos enable row level security;
create policy projetos_da_org on projetos for all to authenticated
  using (papel_na_org(organizacao_id) is not null)
  with check (papel_na_org(organizacao_id) is not null);
grant select, insert, update, delete on projetos to authenticated;
```

## A cobrança (ponto de extensão)

Nenhum usuário grava em `assinaturas`. Quem grava é o seu servidor, com a service key, quando o gateway de
cobrança avisa (webhook). Em pseudocódigo:

```ts
// POST /api/webhook-cobranca, no SEU servidor, com a assinatura do gateway conferida
await superdbComServiceKey.from('assinaturas')
  .update({ estado: 'ativa', plano: 'pro', vence_em, referencia_externa: idDoGateway })
  .eq('organizacao_id', orgDoPagamento);
```

A service key nunca vai no front nem em variável `NEXT_PUBLIC_`.

## Rodar local

```bash
npx degit superdb-br/templates/pocket/saas meu-app
cd meu-app && npm install
cp .env.example .env.local   # URL, chave anon e slug (painel do SuperDB, botão "Conectar")
npm run dev
```

As tabelas: use **Usar este modelo** em [superdb.com.br/pocket/saas](https://superdb.com.br/pocket/saas), ou cole o
[`schema.sql`](./schema.sql) no SQL Editor.

## Deploy na Vercel

Importe a pasta na Vercel e preencha `NEXT_PUBLIC_SUPERDB_URL`, `NEXT_PUBLIC_SUPERDB_PROJECT` e
`NEXT_PUBLIC_SUPERDB_ANON_KEY` (painel do SuperDB, botão "Conectar"). Se você usa a Integração da Vercel do SuperDB, ligar este
projeto da Vercel ao seu projeto SuperDB nela também preenche as três.

## Quanto custa rodar

Os números de cada plano estão na página do modelo: [superdb.com.br/pocket/saas](https://superdb.com.br/pocket/saas#custo).
