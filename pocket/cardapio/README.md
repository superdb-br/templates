# Cardápio com pedido no Pix · Pocket SuperDB

O cliente abre o cardápio pelo link da loja, escolhe os itens e paga por Pix estático: o QR Code e o "copia e
cola" saem da chave Pix do dono, com o valor do pedido. O pedido fica **aguardando** até o dono conferir o
pagamento no banco e confirmar. Nenhum gateway, nenhuma taxa, e o dinheiro não passa pelo SuperDB.

Next.js (App Router) + [`@superdb/client`](https://www.npmjs.com/package/@superdb/client). Licença MIT.

## O que o modelo cria no seu projeto

| Tabela | O que guarda |
|---|---|
| `config_loja` | a loja, o dono, a chave Pix e o código do link público |
| `categorias` | as seções do cardápio |
| `produtos` | nome, descrição, preço e o endereço da foto |
| `pedidos` | nome e telefone do cliente, observação, total e status |
| `itens_pedido` | o que foi pedido, com o preço da hora do pedido |

**Segurança (RLS):** cada dono só vê e altera a própria loja e os pedidos dela. A chave anon não lê tabela
nenhuma: o cardápio sai de `cardapio_publico(código)`, o pedido entra por `fazer_pedido()` (que usa o preço do
banco, nunca o que o navegador manda) e o cliente acompanha por `pedido_publico(id)`, sem nome nem telefone.

## Rodar local

```bash
npx degit superdb-br/templates/pocket/cardapio meu-app
cd meu-app && npm install
cp .env.example .env.local   # URL, chave anon e slug (painel do SuperDB, botão "Conectar")
npm run dev
```

As tabelas: use **Usar este modelo** em [superdb.com.br/pocket/cardapio](https://superdb.com.br/pocket/cardapio),
ou cole o [`schema.sql`](./schema.sql) no SQL Editor. O [`seed.sql`](./seed.sql) cria uma loja fictícia em
`/c/exemplo-cardapio-pocket`, fechada para pedidos e com uma chave Pix que não recebe nada. A sua loja você cria no app.

Telas: `/entrar` e `/painel` (dono), `/c/<código>` (cardápio) e `/pedido/<id>` (Pix e status do pedido).

**Fotos:** guarde as imagens num bucket público do Storage do SuperDB e cole o endereço `https://` no produto.

## Deploy na Vercel

Importe a pasta na Vercel e preencha `NEXT_PUBLIC_SUPERDB_URL`, `NEXT_PUBLIC_SUPERDB_PROJECT` e
`NEXT_PUBLIC_SUPERDB_ANON_KEY` (painel do SuperDB, botão "Conectar"). Se você usa a Integração da Vercel do SuperDB, ligar este
projeto da Vercel ao seu projeto SuperDB nela também preenche as três.

## Quanto custa rodar

Os números de cada plano estão na página do modelo: [superdb.com.br/pocket/cardapio](https://superdb.com.br/pocket/cardapio#custo).
