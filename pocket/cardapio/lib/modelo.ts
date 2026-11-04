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

export const STATUS: Record<string, string> = {
  aguardando: 'Aguardando pagamento',
  confirmado: 'Pagamento confirmado',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};
