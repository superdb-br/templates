# Agenda de salão ou barbearia · Pocket SuperDB

O cliente marca o horário pelo link do salão, sem criar conta (só nome e telefone). O dono entra com login,
vê a agenda do dia, confirma, cancela e apaga o agendamento quando quiser.

Next.js (App Router) + [`@superdb/client`](https://www.npmjs.com/package/@superdb/client). Licença MIT.

## O que o modelo cria no seu projeto

| Tabela | O que guarda |
|---|---|
| `saloes` | o salão, o dono e o código do link público |
| `servicos` | nome, duração e preço |
| `profissionais` | quem atende |
| `horarios` | o expediente de cada profissional por dia da semana |
| `agendamentos` | horário, serviço, profissional, nome e telefone do cliente |

**Segurança (RLS):** cada dono só vê e altera o próprio salão. A chave anon não lê tabela nenhuma: a página
pública usa as funções `agenda_publica`, `horarios_livres` e `agendar`, que exigem o código do salão e
conferem tudo no banco (horário livre, serviço do salão, telefone válido). Dois clientes nunca ficam com o
mesmo horário.

## Rodar local

```bash
npx degit superdb-br/templates/pocket/agenda meu-app
cd meu-app && npm install
cp .env.example .env.local   # URL, chave anon e slug (painel do SuperDB, botão "Conectar")
npm run dev
```

As tabelas: use **Usar este modelo** em [superdb.com.br/pocket/agenda](https://superdb.com.br/pocket/agenda),
ou cole o [`schema.sql`](./schema.sql) no SQL Editor do painel. O [`seed.sql`](./seed.sql) cria um salão
fictício, aberto em `/s/exemplo-salao-pocket`.

Telas: `/entrar` (dono), `/painel` (agenda do dia, serviços, profissionais e expediente) e `/s/<código>`
(o link que você manda aos clientes).

## Deploy na Vercel

Importe a pasta na Vercel e preencha `NEXT_PUBLIC_SUPERDB_URL`, `NEXT_PUBLIC_SUPERDB_PROJECT` e
`NEXT_PUBLIC_SUPERDB_ANON_KEY` (painel do SuperDB, botão "Conectar"). Se você usa a Integração da Vercel do SuperDB, ligar este
projeto da Vercel ao seu projeto SuperDB nela também preenche as três.

## Quanto custa rodar

Os números de cada plano estão na página do modelo: [superdb.com.br/pocket/agenda](https://superdb.com.br/pocket/agenda#custo).

## Para ir além

- Lembrete por WhatsApp ou e-mail um dia antes: uma rotina no seu servidor que lê os agendamentos do dia seguinte.
- O código do link fica em `saloes.codigo_publico`; troque por um mais fácil de lembrar (12 a 40 letras, números e hífen).
