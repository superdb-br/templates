// O que muda de um modelo do Pocket para outro, usado pela base comum.
export const MODELO = {
  slug: 'crm',
  nome: 'CRM',
  paginaDoDono: '/painel',
};

export const TIPOS: Record<string, string> = {
  ligacao: 'Ligação',
  reuniao: 'Reunião',
  email: 'E-mail',
  tarefa: 'Tarefa',
  nota: 'Nota',
};

export function reais(centavos: number) {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function quando(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' });
}
