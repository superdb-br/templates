# Pocket: modelos de app do SuperDB

Apps prontos e úteis, em Next.js (App Router) com `@superdb/client`. Cada pasta é um app que roda sozinho:
tabelas com RLS (`schema.sql`), dados fictícios para testar (`seed.sql`) e as telas.

| Modelo | O que faz |
|---|---|
| [agenda](./agenda) | Agenda de salão ou barbearia: o cliente marca sem conta, o dono vê o dia |
| [cardapio](./cardapio) | Cardápio com pedido e pagamento por Pix estático |
| [presenca](./presenca) | Confirmação de presença por link, com totais e CSV |
| [presentes](./presentes) | Lista de presentes paga direto na chave Pix do dono |
| [painel-admin](./painel-admin) | Painel com papéis (admin e leitor), busca e paginação |
| [saas](./saas) | Organizações, membros, convites e estado da assinatura |
| [crm](./crm) | Contatos, empresas, funil, atividades e lembretes |
| [assistencia](./assistencia) | Assistência técnica: ordem de serviço, estoque e NFS-e ao entregar (modelo Pro) |

## Usar um modelo

O caminho mais curto é o botão **Usar este modelo** em [superdb.com.br/pocket](https://superdb.com.br/pocket):
ele cria as tabelas no seu projeto e mostra o deploy na Vercel. Para fazer à mão:

```bash
npx degit superdb-br/templates/pocket/agenda meu-app
cd meu-app && npm install
cp .env.example .env.local   # URL, chave anon e slug do projeto (painel, botão "Conectar")
```

Depois rode o `schema.sql` no SQL Editor do painel (e o `seed.sql`, se quiser dados de exemplo) e `npm run dev`.

## Para quem mantém

- `catalogo.json` dá a ordem; `<modelo>/pocket.json` é o manifesto (validado por `esquema-manifesto.ts`).
- O código comum mora em `_base/` e é copiado para cada modelo por `bun bin/templates.ts`. Edite a fonte, não a cópia.
- Cada `schema.sql` é provado em `tests/sql/pocket-<modelo>.sql`, com dois donos e a chave anon.
- A cor de cada app está em `app/tema.css` (a mesma do `cor` do `pocket.json`) e o ícone em `public/icone.svg`.
- As fotos e os vídeos da vitrine saem do app de verdade: `bun bin/pocket-capturar.ts` (Docker, ffmpeg e cwebp), depois `bun bin/gerar-pocket.ts`.

Licença MIT.
