// O que muda de um modelo do Pocket para outro, usado pela base comum.
export const MODELO = {
  slug: 'saas',
  nome: 'Meu SaaS',
  paginaDoDono: '/painel',
};

export const ERROS: Record<string, string> = {
  convite_invalido: 'Este convite não vale para o seu e-mail, já foi usado ou expirou. Peça outro.',
  dados_invalidos: 'Dê um nome à organização.',
  sem_sessao: 'Entre de novo.',
};

export const ESTADOS: Record<string, string> = {
  teste: 'em teste',
  ativa: 'ativa',
  atrasada: 'pagamento atrasado',
  cancelada: 'cancelada',
};
