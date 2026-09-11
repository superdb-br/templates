import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { app, superdb } from '../superdb'
import { ErroSuperDB, mensagemDe } from '../lib/superdb/erros'
import { TITULO_MAX, alternarTarefa, apagarTarefa, criarTarefa, listarTarefas, type Tarefa } from '../lib/superdb/tarefas'

export function Tarefas() {
  const [tarefas, setTarefas] = useState<Tarefa[] | null>(null)
  const [titulo, setTitulo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<ErroSuperDB | Error | null>(null)

  const falhou = useCallback((falha: unknown) => {
    // Sessão encerrada (em outro lugar, ou expirada): volta para o login.
    if (falha instanceof ErroSuperDB && falha.codigo === 'sessao_expirada') {
      void app.sair()
      return
    }
    setErro(falha instanceof Error ? falha : new Error(mensagemDe(falha)))
  }, [])

  const carregar = useCallback(async () => {
    try {
      setTarefas(await listarTarefas(superdb))
      setErro(null)
    } catch (falha) {
      falhou(falha)
    }
  }, [falhou])

  useEffect(() => {
    void carregar()
  }, [carregar])

  async function adicionar(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    try {
      const nova = await criarTarefa(superdb, titulo)
      setTarefas((atuais) => [nova, ...(atuais ?? [])])
      setTitulo('')
      setErro(null)
    } catch (falha) {
      falhou(falha)
    } finally {
      setEnviando(false)
    }
  }

  // Alternar e apagar mudam a tela na hora e desfazem se o servidor recusar.
  async function alternar(tarefa: Tarefa) {
    const trocar = (feita: boolean) =>
      setTarefas((atuais) => atuais?.map((t) => (t.id === tarefa.id ? { ...t, feita } : t)) ?? null)
    trocar(!tarefa.feita)
    try {
      await alternarTarefa(superdb, tarefa.id, !tarefa.feita)
    } catch (falha) {
      trocar(tarefa.feita)
      falhou(falha)
    }
  }

  async function apagar(tarefa: Tarefa) {
    const antes = tarefas
    setTarefas((atuais) => atuais?.filter((t) => t.id !== tarefa.id) ?? null)
    try {
      await apagarTarefa(superdb, tarefa.id)
    } catch (falha) {
      setTarefas(antes)
      falhou(falha)
    }
  }

  // Sem a tabela, a tela vira o passo que falta, e não um erro solto.
  if (erro instanceof ErroSuperDB && erro.codigo === 'tabela_ausente') {
    return (
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
          <button className="botao botao-secundario" onClick={() => void carregar()}>
            Conferir de novo
          </button>
        </div>
      </section>
    )
  }

  const feitas = tarefas?.filter((t) => t.feita).length ?? 0

  return (
    <section className="cartao" aria-labelledby="titulo-tarefas">
      <h1 id="titulo-tarefas" className="titulo">
        Suas tarefas
      </h1>

      <form className="nova-tarefa" onSubmit={adicionar}>
        <label htmlFor="nova" className="sr-only">
          Nova tarefa
        </label>
        <input
          id="nova"
          className="entrada"
          placeholder="O que precisa ser feito?"
          maxLength={TITULO_MAX}
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
        />
        <button className="botao" type="submit" disabled={enviando || !titulo.trim()}>
          {enviando ? 'Salvando…' : 'Adicionar'}
        </button>
      </form>

      {erro && (
        <p className="mensagem mensagem-erro mensagem-solta" role="alert">
          {erro.message}
        </p>
      )}

      {!tarefas ? (
        <div className="carregando">Carregando tarefas…</div>
      ) : tarefas.length === 0 ? (
        <p className="vazio">Nenhuma tarefa ainda. Que tal a primeira?</p>
      ) : (
        <>
          <ul className="lista">
            {tarefas.map((t) => (
              <li key={t.id} className={t.feita ? 'tarefa feita' : 'tarefa'}>
                <input
                  type="checkbox"
                  className="caixa"
                  checked={t.feita}
                  onChange={() => void alternar(t)}
                  aria-label={`Marcar "${t.titulo}" como ${t.feita ? 'pendente' : 'feita'}`}
                />
                <span className="tarefa-titulo">{t.titulo}</span>
                <button className="apagar" onClick={() => void apagar(t)} aria-label={`Apagar "${t.titulo}"`}>
                  ×
                </button>
              </li>
            ))}
          </ul>
          <p className="contador">
            {feitas} de {tarefas.length} {tarefas.length === 1 ? 'feita' : 'feitas'}
          </p>
        </>
      )}
    </section>
  )
}
