// O que muda de um modelo do Pocket para outro, usado pela base comum.
export const MODELO = {
  slug: 'painel-admin',
  nome: 'Painel',
  paginaDoDono: '/painel',
};

export const POR_PAGINA = 20;

/** Colunas que o banco preenche sozinho: não aparecem no formulário de criar. */
export const AUTOMATICAS = new Set(['id', 'criado_em', 'created_at', 'updated_at', 'dono_id', 'user_id']);

export type Papel = 'admin' | 'leitor' | null;

/** Nome de tabela ou coluna que pode ir para a URL da API (o resto é recusado). */
export const nomeValido = (n: string) => /^[a-z_][a-z0-9_]{0,62}$/.test(n);

export function mostrar(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

const INSTANTE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** O valor na célula da tabela: data e hora em português e o id encurtado. Para editar, use mostrar(). */
export function exibir(v: unknown): string {
  if (typeof v === 'string' && INSTANTE.test(v)) {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' });
    }
  }
  if (typeof v === 'string' && UUID.test(v)) return `${v.slice(0, 8)}…`;
  return mostrar(v);
}
