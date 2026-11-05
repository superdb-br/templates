// O que muda de um modelo do Pocket para outro, usado pela base comum.
export const MODELO = {
  slug: 'assistencia',
  nome: 'Assistência técnica',
  paginaDoDono: '/painel',
};

export const STATUS: Record<string, string> = {
  aberta: 'Aberta',
  em_andamento: 'Em andamento',
  pronta: 'Pronta',
  entregue: 'Entregue',
  cancelada: 'Cancelada',
};

/** O status que a equipe muda à mão. Entregar é outro botão: ele baixa o estoque. */
/** O tom da etiqueta de cada status da ordem. */
export const TOM: Record<string, 'destaque' | 'aviso' | 'ok' | 'neutro' | 'perigo'> = {
  aberta: 'destaque',
  em_andamento: 'aviso',
  pronta: 'ok',
  entregue: 'neutro',
  cancelada: 'perigo',
};

export const STATUS_DA_BANCADA = ['aberta', 'em_andamento', 'pronta'] as const;

export const PAPEIS: Record<string, string> = { dono: 'Dono', atendente: 'Atendente', tecnico: 'Técnico' };

export function reais(centavos: number) {
  return (Number(centavos) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function quando(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' });
}

/** "R$ 1.234,56", "1234,56" ou "1234.56" em centavos; vazio ou torto vira null. */
export function centavosDe(texto: string): number | null {
  const limpo = texto.replace(/[R$\s]/g, '');
  if (!limpo) return null;
  const numero = Number(limpo.includes(',') ? limpo.replace(/\./g, '').replace(',', '.') : limpo);
  return Number.isFinite(numero) && numero >= 0 ? Math.round(numero * 100) : null;
}

/** As mensagens que as funções do banco levantam, em português para o balcão. */
export function traduzirRegra(mensagem: string): string {
  const peca = /estoque_insuficiente: (\S+)/.exec(mensagem)?.[1];
  if (peca) return `Falta a peça ${peca} no estoque. A ordem não foi entregue e nada foi baixado.`;
  const regras: Record<string, string> = {
    ordem_fechada: 'Esta ordem já foi entregue ou cancelada e não muda mais.',
    ordem_nao_encontrada_ou_fechada: 'Esta ordem não existe ou já foi entregue ou cancelada.',
    so_a_equipe: 'Só a equipe da loja faz isso.',
    so_o_dono_movimenta_estoque: 'Só o dono lança compra e ajuste de estoque.',
    movimento_invalido: 'Quantidade inválida para esse movimento.',
    peca_nao_encontrada: 'Peça não encontrada (serviço não tem estoque).',
    status_invalido: 'Status inválido. Para entregar, use o botão Entregar.',
  };
  for (const [codigo, frase] of Object.entries(regras)) if (mensagem.includes(codigo)) return frase;
  return mensagem;
}
