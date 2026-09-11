import { redirect } from 'next/navigation';
import { superdbDoServidor } from '@/lib/superdb/servidor';
import { listarTarefas, type Tarefa } from '@/lib/superdb/tarefas';
import { ErroSuperDB, mensagemDe } from '@/lib/superdb/erros';
import { Cabecalho } from '../Cabecalho';
import { sair } from '../acoes';
import { ListaDeTarefas } from './ListaDeTarefas';

export default async function PaginaTarefas() {
  const superdb = await superdbDoServidor();
  const sessao = (await superdb.auth.getSession()).data.session;
  // A página confere a sessão por conta própria: o proxy renova, não protege.
  if (!sessao) redirect('/');

  let tarefas: Tarefa[] = [];
  let erro: ErroSuperDB | null = null;
  try {
    // Busca no servidor, com o token de quem está logado: o RLS devolve só as dele.
    tarefas = await listarTarefas(superdb);
  } catch (falha) {
    erro = falha instanceof ErroSuperDB ? falha : new ErroSuperDB('erro', mensagemDe(falha));
  }

  return (
    <>
      <Cabecalho email={sessao.user?.email} />
      {erro?.codigo === 'tabela_ausente' ? (
        // Sem a tabela, a tela vira o passo que falta, e não um erro solto.
        <section className="cartao">
          <h1 className="titulo">Falta criar a tabela</h1>
          <p className="subtitulo">
            O app está ligado ao projeto, mas a tabela <code>tarefas</code> ainda não existe.
          </p>
          <ol className="lista-numerada">
            <li>Abra o projeto no painel do SuperDB e clique em SQL Editor.</li>
            <li>
              Cole o conteúdo do arquivo <code>superdb/schema.sql</code> deste template e rode.
            </li>
            <li>Volte aqui e confira de novo.</li>
          </ol>
          <div className="acoes">
            <a className="botao" href="https://app.superdb.com.br" target="_blank" rel="noreferrer">
              Abrir o painel
            </a>
            <a className="botao botao-secundario" href="/tarefas">
              Conferir de novo
            </a>
          </div>
        </section>
      ) : erro?.codigo === 'sessao_expirada' ? (
        <section className="cartao">
          <h1 className="titulo">Sua sessão expirou</h1>
          <p className="subtitulo">Entre de novo para continuar.</p>
          <form action={sair} className="acoes">
            <button className="botao" type="submit">
              Entrar de novo
            </button>
          </form>
        </section>
      ) : (
        <section className="cartao" aria-labelledby="titulo-tarefas">
          <h1 id="titulo-tarefas" className="titulo">
            Suas tarefas
          </h1>
          {erro && <p className="mensagem mensagem-erro mensagem-solta">{erro.message}</p>}
          <ListaDeTarefas tarefas={tarefas} />
        </section>
      )}
    </>
  );
}
