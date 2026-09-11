// Versão JavaScript, gerada a partir do TypeScript que os outros templates usam.
// Mensagens de erro em português, a partir dos códigos que o SuperDB devolve.
//
// O SDK devolve `{ code, message }` em inglês e técnico ("invalid_credentials",
// "PGRST205"). Quem usa o app precisa de uma frase que diga o que fazer. Os
// códigos abaixo são os que o SuperDB realmente emite no login, no cadastro e na
// API de dados; um código desconhecido cai na mensagem original, sem se perder.
export class ErroSuperDB extends Error {
  codigo;
  status;
  constructor(codigo, mensagem, status) {
    super(mensagem);
    this.name = 'ErroSuperDB';
    this.codigo = codigo;
    this.status = status;
  }
}
const DO_LOGIN = {
  invalid_credentials: 'E-mail ou senha incorretos.',
  user_already_exists: 'Já existe uma conta com esse e-mail. Tente entrar.',
  password_breached: 'Essa senha aparece em vazamentos conhecidos. Escolha outra.',
  invalid_request: 'Confira os campos: e-mail válido e senha com pelo menos 8 caracteres.',
  account_locked: 'Muitas tentativas erradas. Espere alguns minutos e tente de novo.',
  rate_limited: 'Muitas tentativas em pouco tempo. Espere um pouco e tente de novo.',
  user_inactive: 'Esta conta está desativada.',
  user_not_found: 'Esta conta não existe mais.',
  hook_blocked: 'O cadastro foi recusado por uma regra deste projeto.',
  tenant_not_found: 'O projeto configurado não existe. Confira o slug no arquivo .env.',
  mfa_step_up_required: 'Este projeto exige verificação em duas etapas, que este template não implementa.',
  mfa_enrollment_required: 'Este projeto exige verificação em duas etapas, que este template não implementa.',
  refresh_token_reuse: 'Sua sessão foi encerrada por segurança. Entre de novo.',
  refresh_token_invalid: 'Sua sessão expirou. Entre de novo.',
  no_session: 'Você não está logado.',
};
/** Erro de `superdb.auth.*` (entrar, criar conta, renovar, sair). */
export function traduzirErroDeLogin(erro) {
  const codigo = erro.code ?? 'erro_desconhecido';
  const mensagem = DO_LOGIN[codigo] ?? erro.message ?? 'Não deu para completar agora. Tente de novo.';
  return new ErroSuperDB(codigo, mensagem, erro.status);
}
/** Erro de `superdb.from(...)`: o PostgREST fala em códigos PGRST e SQLSTATE. */
export function traduzirErroDeDados(erro, status) {
  const codigo = erro.code ?? '';
  const texto = `${erro.message ?? ''} ${erro.details ?? ''}`;
  // A tabela não existe: o schema.sql ainda não foi rodado neste projeto.
  if (codigo === 'PGRST205' || codigo === '42P01' || /could not find the table/i.test(texto)) {
    return new ErroSuperDB('tabela_ausente', 'A tabela "tarefas" ainda não existe neste projeto. Rode o arquivo superdb/schema.sql no SQL Editor do painel.', status);
  }
  if (codigo === 'network' || status === 0) {
    return new ErroSuperDB('sem_conexao', 'Sem conexão com o SuperDB. Confira a internet e tente de novo.', status);
  }
  // Token vencido, inválido ou de outro projeto.
  if (status === 401 || codigo === 'PGRST301' || codigo === 'PGRST302' || codigo === 'PGRST303') {
    return new ErroSuperDB('sessao_expirada', 'Sua sessão expirou. Entre de novo.', status);
  }
  if (codigo === '42501' || status === 403) {
    return new ErroSuperDB('sem_permissao', 'Sem permissão para isso. Entre com a conta dona da tarefa.', status);
  }
  // `.single()` sem linha: a tarefa sumiu ou é de outra pessoa (o RLS esconde).
  if (codigo === 'PGRST116') {
    return new ErroSuperDB('nao_encontrada', 'Tarefa não encontrada. Talvez ela já tenha sido apagada.', status);
  }
  if (codigo === '23514') {
    return new ErroSuperDB('titulo_invalido', 'A tarefa precisa ter entre 1 e 200 caracteres.', status);
  }
  if (codigo === 'PGRST106') {
    return new ErroSuperDB('projeto_invalido', 'A API de dados não reconhece este projeto. Confira o slug no arquivo .env.', status);
  }
  if (status === 429) {
    return new ErroSuperDB('muitas_requisicoes', 'Muitas requisições em pouco tempo. Espere um pouco.', status);
  }
  return new ErroSuperDB(codigo || 'erro_de_dados', erro.message ?? `Erro ${status} na API de dados.`, status);
}
/** Qualquer coisa que chegou num `catch` vira uma frase para a tela. */
export function mensagemDe(erro) {
  if (erro instanceof ErroSuperDB)
    return erro.message;
  if (erro instanceof Error && erro.message)
    return erro.message;
  return 'Algo deu errado. Tente de novo.';
}
