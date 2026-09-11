import { useEffect, useState } from 'react'
import type { Session } from '@superdb/client'
import { app, configurado } from './superdb'
import { usuarioDa } from './lib/superdb/sessao'
import { Diagnostico } from './componentes/Diagnostico'
import { Entrar } from './componentes/Entrar'
import { Tarefas } from './componentes/Tarefas'

export default function App() {
  const [carregando, setCarregando] = useState(configurado)
  const [sessao, setSessao] = useState<Session | null>(null)

  useEffect(() => {
    if (!configurado) return
    let ativo = true
    // A sessão guardada volta sozinha (e já renovada, se estava vencendo).
    app
      .sessao()
      .then((s) => ativo && setSessao(s))
      .catch(() => undefined)
      .finally(() => ativo && setCarregando(false))
    // Login, saída e renovação, inclusive em outra aba, chegam por aqui.
    const parar = app.aoMudar((s) => setSessao(s))
    return () => {
      ativo = false
      parar()
    }
  }, [])

  const usuario = usuarioDa(sessao)

  return (
    <div className="pagina">
      <main className="coluna">
        <header className="cabecalho">
          <div className="marca">
            <img src="/favicon.svg" alt="" />
            Tarefas
          </div>
          {usuario && (
            <div className="quem">
              <span>{usuario.email}</span>
              <button className="botao botao-secundario botao-pequeno" onClick={() => void app.sair()}>
                Sair
              </button>
            </div>
          )}
        </header>

        {!configurado ? (
          <Diagnostico />
        ) : carregando ? (
          <div className="cartao carregando">Carregando…</div>
        ) : sessao ? (
          <Tarefas />
        ) : (
          <>
            <Entrar />
            {/* Confere a ligação com o projeto, só em desenvolvimento (npm run dev). */}
            {import.meta.env.DEV && <Diagnostico />}
          </>
        )}

        <footer className="rodape">
          Template React do SuperDB ·{' '}
          <a href="https://github.com/superdb-br/templates" target="_blank" rel="noreferrer">
            código
          </a>{' '}
          ·{' '}
          <a href="https://superdb.com.br/docs" target="_blank" rel="noreferrer">
            documentação
          </a>
        </footer>
      </main>
    </div>
  )
}
