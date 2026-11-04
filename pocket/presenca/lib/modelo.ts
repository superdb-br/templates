// O que muda de um modelo do Pocket para outro, usado pela base comum.
export const MODELO = {
  slug: 'presenca',
  nome: 'Presença',
  paginaDoDono: '/painel',
};

export const FUSO = 'America/Sao_Paulo';

export const ERROS: Record<string, string> = {
  evento_nao_encontrado: 'Este convite não existe. Confira o link com quem convidou.',
  respostas_encerradas: 'As confirmações deste evento já foram encerradas.',
  dados_invalidos: 'Confira o nome e quantas pessoas vão (de 1 a 20).',
};

export function quando(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { timeZone: FUSO, dateStyle: 'full', timeStyle: 'short' });
}

/** Uma célula de CSV: aspas em volta e aspas dobradas por dentro; fórmula vira texto. */
export function celula(v: unknown) {
  let t = v == null ? '' : String(v);
  if (/^[=+\-@]/.test(t)) t = `'${t}`;
  return `"${t.replace(/"/g, '""')}"`;
}
