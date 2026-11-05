# Assistência técnica com nota · Pocket SuperDB

O balcão de uma assistência técnica: clientes, peças e serviços com preço de tabela, ordens de serviço (aberta, em
andamento, pronta, entregue) e o estoque das peças. Ao entregar a ordem, o banco baixa as peças e o servidor do app
emite a NFS-e da mão de obra pelo [SuperDB Fiscal](https://superdb.com.br/docs/notas-fiscais).

**Modelo Pro.** Funciona em qualquer plano em modo teste: abaixo do plano Pro, a nota sai em homologação, de teste e
sem valor fiscal, e a tela avisa. Emitir de verdade pede o plano Pro (ou Escala) do SuperDB.

Next.js (App Router) + [`@superdb/client`](https://www.npmjs.com/package/@superdb/client). Licença MIT.

## O que o modelo cria no seu projeto

| Tabela | O que guarda |
|---|---|
| `equipe` | quem usa o balcão, com o papel (dono, atendente ou técnico) |
| `clientes` | nome, CPF ou CNPJ, telefone, e-mail e o endereço que a NFS-e pede |
| `catalogo` | peças (com estoque) e serviços (sem), com o preço de tabela |
| `ordens_servico` | equipamento, defeito, status, os totais e a NFS-e |
| `itens_ordem` | as peças e os serviços de cada ordem, com o preço de tabela |
| `movimentos_estoque` | cada entrada e saída de peça, com quem e quando |

**O que o banco garante, não só o app:**
- RLS em toda tabela: quem não é da equipe não vê nada, e a chave anon também não.
- O preço do item é o do catálogo, mesmo que o app mande outro.
- O estoque nunca fica negativo: a coluna tem `CHECK (estoque >= 0)` e `entregar_ordem()` baixa as peças numa
  transação só. Faltou uma peça, nada baixa e a ordem continua aberta.
- Ninguém grava o estoque direto: só por `entregar_ordem()` e por `movimentar_estoque()` (compra e ajuste, só o dono).
- Ordem entregue ou cancelada não muda mais. Só o dono muda preço e põe gente na equipe.

## Primeiro acesso: o dono da loja

Ninguém entra na equipe sozinho. Crie a sua conta no app; a primeira tela mostra o seu código e o SQL para colar no
SQL Editor do painel do SuperDB:

```sql
insert into equipe (user_id, nome, papel) values ('<o seu código>', 'Seu nome', 'dono');
```

Depois, atendentes e técnicos criam a conta no app e mandam o código deles; o dono os põe na equipe pela tela
**Equipe**.

## A nota fiscal (NFS-e)

1. No painel do SuperDB, abra **Notas fiscais** do projeto, ative o Fiscal e cadastre o CNPJ da loja e o serviço
   padrão (código de tributação e NBS: confirme com o contador). O passo a passo está em
   [superdb.com.br/docs/notas-fiscais](https://superdb.com.br/docs/notas-fiscais).
2. No servidor do app (na Vercel, em Environment Variables), defina `SUPERDB_SERVICE_ROLE_KEY` com a chave de serviço
   do projeto. Ela NÃO tem o prefixo `NEXT_PUBLIC_`: fica só no servidor, em `lib/fiscal.ts`, e nunca vai ao navegador.
3. Pronto: ao entregar uma ordem com serviço, o app pede a NFS-e. A referência é o número da ordem (`os-<número>`):
   pedir de novo devolve a mesma nota, sem duplicar.

Abaixo do plano Pro, a nota sai em **homologação**: nota de teste, sem valor fiscal (a tela da ordem diz isso). No
Pro e no Escala, com o pedido de produção conferido pela equipe do SuperDB, a nota vale de verdade.

A NFS-e é da **mão de obra**. Peça vendida é mercadoria (NF-e, com ICMS): o SuperDB não emite NF-e. A nota pede o
CPF ou CNPJ e o endereço completo do cliente.

O que este modelo não faz: não manda mensagem ao cliente (nem por WhatsApp nem por e-mail) e não recebe pagamento.

## Rodar local

```bash
npx degit superdb-br/templates/pocket/assistencia meu-app
cd meu-app && npm install
cp .env.example .env.local   # URL, chave anon e slug (painel do SuperDB, botão "Conectar")
# e, para emitir nota: SUPERDB_SERVICE_ROLE_KEY=... no .env.local (só no servidor)
npm run dev
```

As tabelas: use **Usar este modelo** em [superdb.com.br/pocket/assistencia](https://superdb.com.br/pocket/assistencia),
ou cole o [`schema.sql`](./schema.sql) no SQL Editor.

## Deploy na Vercel

Importe a pasta na Vercel e preencha `NEXT_PUBLIC_SUPERDB_URL`, `NEXT_PUBLIC_SUPERDB_PROJECT` e
`NEXT_PUBLIC_SUPERDB_ANON_KEY` (painel do SuperDB, botão "Conectar"), mais `SUPERDB_SERVICE_ROLE_KEY` para a nota. Se
você usa a Integração da Vercel do SuperDB, ligar este projeto da Vercel ao seu projeto SuperDB nela também preenche
as três primeiras.

## Quanto custa rodar

Os números de cada plano estão na página do modelo:
[superdb.com.br/pocket/assistencia](https://superdb.com.br/pocket/assistencia#custo).
