# Lista de presentes com Pix · Pocket SuperDB

Cada presente tem um valor. O convidado escolhe pelo link, deixa o nome e um recado e paga por Pix estático direto
na chave de quem recebe (o BR Code já vem com o valor). O item fica **escolhido** até o dono ver o dinheiro no
banco e marcar como **recebido**. Nenhum gateway, e o dinheiro não passa pelo SuperDB.

Next.js (App Router) + [`@superdb/client`](https://www.npmjs.com/package/@superdb/client). Licença MIT.

## O que o modelo cria no seu projeto

| Tabela | O que guarda |
|---|---|
| `listas` | título, mensagem, a chave Pix e o código do link |
| `itens` | nome, valor e status (disponível, escolhido, recebido) |
| `contribuicoes` | o nome e o recado de quem escolheu cada item |

**Segurança (RLS):** cada dono só vê as próprias listas e quem contribuiu. A chave anon não lê tabela nenhuma:
a lista sai de `lista_publica(código)`, sem o nome de quem deu cada presente, e a escolha entra por
`declarar_presente()`, que só aceita item disponível daquela lista (dois convidados nunca levam o mesmo).

## Rodar local

```bash
npx degit superdb-br/templates/pocket/presentes meu-app
cd meu-app && npm install
cp .env.example .env.local   # URL, chave anon e slug (painel do SuperDB, botão "Conectar")
npm run dev
```

As tabelas: use **Usar este modelo** em [superdb.com.br/pocket/presentes](https://superdb.com.br/pocket/presentes),
ou cole o [`schema.sql`](./schema.sql) no SQL Editor. O [`seed.sql`](./seed.sql) cria uma lista fictícia em
`/l/exemplo-presentes-pocket`, com uma chave Pix que não recebe nada. A sua lista você cria no app.

Telas: `/entrar` e `/painel` (dono), `/l/<código>` (a lista) e `/l/<código>/pagar/<item>` (o Pix).

## Deploy na Vercel

Importe a pasta na Vercel e preencha `NEXT_PUBLIC_SUPERDB_URL`, `NEXT_PUBLIC_SUPERDB_PROJECT` e
`NEXT_PUBLIC_SUPERDB_ANON_KEY` (painel do SuperDB, botão "Conectar"). Se você usa a Integração da Vercel do SuperDB, ligar este
projeto da Vercel ao seu projeto SuperDB nela também preenche as três.

## Quanto custa rodar

Os números de cada plano estão na página do modelo: [superdb.com.br/pocket/presentes](https://superdb.com.br/pocket/presentes#custo).
