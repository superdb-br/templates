// O que muda de um modelo do Pocket para outro, usado pela base comum.
export const MODELO = {
  slug: 'agenda',
  nome: 'Agenda',
  /** Para onde o dono vai depois de entrar. */
  paginaDoDono: '/painel',
};

export const FUSO = 'America/Sao_Paulo';
export const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export const ERROS: Record<string, string> = {
  salao_nao_encontrado: 'Este link de agendamento não existe. Confira com o salão.',
  dados_invalidos: 'Confira o nome, o telefone (com DDD) e a escolha de serviço e profissional.',
  horario_indisponivel: 'Esse horário acabou de ser ocupado ou não está mais livre. Escolha outro.',
};

export function reais(centavos: number) {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function hora(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: FUSO });
}

/** Hoje, no fuso de Brasília, como AAAA-MM-DD. */
export function hoje() {
  return new Date().toLocaleDateString('en-CA', { timeZone: FUSO });
}
