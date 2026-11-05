// O que muda de um modelo do Pocket para outro, usado pela base comum.
export const MODELO = {
  slug: 'cardapio',
  nome: 'Cardápio',
  paginaDoDono: '/painel',
};

export const ERROS: Record<string, string> = {
  loja_nao_encontrada: 'Este cardápio não existe. Confira o link com a loja.',
  loja_fechada: 'A loja não está recebendo pedidos agora.',
  dados_invalidos: 'Confira o nome, o telefone com DDD e as quantidades.',
  produto_indisponivel: 'Um dos produtos saiu do cardápio. Atualize a página e monte o pedido de novo.',
};

/** O tom da etiqueta de cada status, no painel. */
export const TOM: Record<string, 'aviso' | 'ok' | 'neutro' | 'perigo'> = {
  aguardando: 'aviso',
  confirmado: 'ok',
  entregue: 'neutro',
  cancelado: 'perigo',
};

/** +5511900000201 → (11) 90000-0201, para ler; o link tel: usa o número cru. */
export function telefone(t: string) {
  const m = /^\+55(\d{2})(\d{4,5})(\d{4})$/.exec(t);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : t;
}

export const STATUS: Record<string, string> = {
  aguardando: 'Aguardando pagamento',
  confirmado: 'Pagamento confirmado',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};
