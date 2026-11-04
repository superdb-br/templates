# CRM simples · Pocket SuperDB

Contatos, empresas, um funil com etapas, negócios andando pelo funil e atividades com data para lembrar. Cada
pessoa tem o próprio CRM.

Next.js (App Router) + [`@superdb/client`](https://www.npmjs.com/package/@superdb/client). Licença MIT.

## O que o modelo cria no seu projeto

| Tabela | O que guarda |
|---|---|
| `empresas` | nome e site |
| `contatos` | nome, e-mail, telefone e a empresa |
| `etapas` | as colunas do funil (o padrão nasce na primeira visita, por `criar_etapas_padrao()`) |
| `negocios` | título, valor, etapa, contato e empresa |
| `atividades` | ligação, reunião, e-mail, tarefa ou nota, com data para lembrar |

**Segurança (RLS):** cada linha é de quem criou. Um negócio só aponta para etapa, contato e empresa do mesmo dono:
a policy confere, e mandar o id de outra pessoa não funciona. A chave anon não lê nada.

## Rodar local

```bash
npx degit superdb-br/templates/pocket/crm meu-app
cd meu-app && npm install
cp .env.example .env.local   # URL, chave anon e slug (painel do SuperDB, botão "Conectar")
npm run dev
```

As tabelas: use **Usar este modelo** em [superdb.com.br/pocket/crm](https://superdb.com.br/pocket/crm), ou cole o
[`schema.sql`](./schema.sql) no SQL Editor.

## Para ir além

- CRM de equipe: troque `dono_id = auth.uid()` por uma regra de organização (veja o modelo [saas](../saas)).
- Lembrete por e-mail: uma rotina no seu servidor que lê `atividades` com `lembrar_em` vencido e `feita = false`.

## Deploy na Vercel

Importe a pasta na Vercel e preencha `NEXT_PUBLIC_SUPERDB_URL`, `NEXT_PUBLIC_SUPERDB_PROJECT` e
`NEXT_PUBLIC_SUPERDB_ANON_KEY` (painel do SuperDB, botão "Conectar"). Se você usa a Integração da Vercel do SuperDB, ligar este
projeto da Vercel ao seu projeto SuperDB nela também preenche as três.

## Quanto custa rodar

Os números de cada plano estão na página do modelo: [superdb.com.br/pocket/crm](https://superdb.com.br/pocket/crm#custo).
