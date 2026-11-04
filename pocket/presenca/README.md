# Confirmação de presença · Pocket SuperDB

O anfitrião cria o evento e manda o link. O convidado confirma sem conta: nome, quantas pessoas vão e um recado.
O anfitrião vê os totais, encerra as confirmações quando quiser e baixa a lista em CSV.

Next.js (App Router) + [`@superdb/client`](https://www.npmjs.com/package/@superdb/client). Licença MIT.

## O que o modelo cria no seu projeto

| Tabela | O que guarda |
|---|---|
| `eventos` | título, data, local, descrição e o código do link |
| `convidados_resposta` | nome, se vai, quantas pessoas e o recado |

**Segurança (RLS):** cada anfitrião só vê os próprios eventos e respostas. A chave anon não lê tabela nenhuma:
o convite sai de `evento_publico(código)`, que não mostra quem respondeu, e a resposta entra por
`responder_presenca()`. O código do link tem 16 caracteres aleatórios.

## Rodar local

```bash
npx degit superdb-br/templates/pocket/presenca meu-app
cd meu-app && npm install
cp .env.example .env.local   # URL, chave anon e slug (painel do SuperDB, botão "Conectar")
npm run dev
```

As tabelas: use **Usar este modelo** em [superdb.com.br/pocket/presenca](https://superdb.com.br/pocket/presenca),
ou cole o [`schema.sql`](./schema.sql) no SQL Editor. O [`seed.sql`](./seed.sql) cria um evento fictício em
`/e/exemplo-presenca-pocket`.

Telas: `/entrar` e `/painel` (anfitrião, com o CSV em `/painel/csv/<id>`) e `/e/<código>` (o convite).

## Deploy na Vercel

Importe a pasta na Vercel e preencha `NEXT_PUBLIC_SUPERDB_URL`, `NEXT_PUBLIC_SUPERDB_PROJECT` e
`NEXT_PUBLIC_SUPERDB_ANON_KEY` (painel do SuperDB, botão "Conectar"). Se você usa a Integração da Vercel do SuperDB, ligar este
projeto da Vercel ao seu projeto SuperDB nela também preenche as três.

## Quanto custa rodar

Os números de cada plano estão na página do modelo: [superdb.com.br/pocket/presenca](https://superdb.com.br/pocket/presenca#custo).
