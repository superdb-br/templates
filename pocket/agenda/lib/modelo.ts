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

/** Os status de um horário, com o nome na tela e o tom da etiqueta. */
export const STATUS: Record<string, { nome: string; tom: 'destaque' | 'ok' | 'neutro' | 'perigo' }> = {
  marcado: { nome: 'Marcado', tom: 'destaque' },
  confirmado: { nome: 'Confirmado', tom: 'ok' },
  concluido: { nome: 'Concluído', tom: 'neutro' },
  cancelado: { nome: 'Cancelado', tom: 'perigo' },
};

/** +5511900000101 → (11) 90000-0101, para ler; o link tel: usa o número cru. */
export function telefone(t: string) {
  const m = /^\+55(\d{2})(\d{4,5})(\d{4})$/.exec(t);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : t;
}

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
