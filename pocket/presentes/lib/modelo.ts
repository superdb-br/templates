// O que muda de um modelo do Pocket para outro, usado pela base comum.
export const MODELO = {
  slug: 'presentes',
  nome: 'Lista de presentes',
  paginaDoDono: '/painel',
};

export const ERROS: Record<string, string> = {
  lista_nao_encontrada: 'Esta lista não existe. Confira o link.',
  dados_invalidos: 'Escreva o seu nome para quem recebe saber de quem veio.',
  item_indisponivel: 'Alguém acabou de escolher este presente. Escolha outro.',
};

export const STATUS: Record<string, string> = {
  disponivel: 'disponível',
  declarado: 'escolhido, conferir Pix',
  recebido: 'recebido',
};
