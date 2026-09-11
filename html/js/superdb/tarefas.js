// Versão JavaScript, gerada a partir do TypeScript que os outros templates usam.
// As quatro operações do app, em cima de `superdb.from('tarefas')`.
//
// Repare no que NÃO aparece aqui: nenhum filtro por usuário e nenhum user_id.
// Quem separa as tarefas de cada pessoa é o banco (a regra de RLS do
// superdb/schema.sql), a partir do token de quem chama. Se o app esquecer um
// filtro, o banco não esquece.
import { ErroSuperDB, traduzirErroDeDados } from './erros.js';
// Pedir as colunas pelo nome, e não `*`: coluna nova na tabela não muda o que o
// app recebe sem você perceber.
const COLUNAS = 'id,titulo,feita,criada_em';
export const TITULO_MAX = 200;
export async function listarTarefas(superdb) {
  const { data, error, status } = await superdb
    .from('tarefas')
    .select(COLUNAS)
    .order('criada_em', { ascending: false });
  if (error)
    throw traduzirErroDeDados(error, status);
  return data ?? [];
}
export async function criarTarefa(superdb, titulo) {
  const limpo = titulo.trim();
  // Mesma regra do CHECK da tabela, conferida antes para a resposta ser imediata.
  if (!limpo)
    throw new ErroSuperDB('titulo_vazio', 'Escreva a tarefa antes de adicionar.');
  if (limpo.length > TITULO_MAX) {
    throw new ErroSuperDB('titulo_invalido', `A tarefa pode ter até ${TITULO_MAX} caracteres.`);
  }
  const { data, error, status } = await superdb
    .from('tarefas')
    .insert({ titulo: limpo })
    .select(COLUNAS)
    .single();
  if (error)
    throw traduzirErroDeDados(error, status);
  return data;
}
export async function alternarTarefa(superdb, id, feita) {
  const { data, error, status } = await superdb
    .from('tarefas')
    .update({ feita })
    .eq('id', id)
    .select(COLUNAS)
    .single();
  if (error)
    throw traduzirErroDeDados(error, status);
  return data;
}
export async function apagarTarefa(superdb, id) {
  const { error, status } = await superdb.from('tarefas').delete().eq('id', id);
  if (error)
    throw traduzirErroDeDados(error, status);
}
