import { useState, type FormEvent } from 'react'
import { app } from '../superdb'
import { mensagemDe } from '../lib/superdb/erros'

type Modo = 'entrar' | 'criar'

export function Entrar() {
  const [modo, setModo] = useState<Modo>('entrar')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setErro(null)
    try {
      // Deu certo: o App recebe a sessão pelo aoMudar e troca de tela sozinho.
      if (modo === 'entrar') await app.entrar(email, senha)
      else await app.criarConta(email, senha)
    } catch (falha) {
      setErro(mensagemDe(falha))
      setEnviando(false)
    }
  }

  function trocar(novo: Modo) {
    setModo(novo)
    setErro(null)
  }

  return (
    <section className="cartao" aria-labelledby="titulo-entrar">
      <h1 id="titulo-entrar" className="titulo">
        {modo === 'entrar' ? 'Entre para ver suas tarefas' : 'Crie sua conta'}
      </h1>
      <p className="subtitulo">Cada pessoa só enxerga as próprias tarefas.</p>

      <div className="abas" role="tablist" aria-label="Entrar ou criar conta">
        <button type="button" role="tab" className="aba" aria-selected={modo === 'entrar'} onClick={() => trocar('entrar')}>
          Entrar
        </button>
        <button type="button" role="tab" className="aba" aria-selected={modo === 'criar'} onClick={() => trocar('criar')}>
          Criar conta
        </button>
      </div>

      <form className="formulario" onSubmit={enviar}>
        <label className="campo">
          <span className="rotulo">E-mail</span>
          <input
            className="entrada"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <div className="campo">
          <label className="rotulo" htmlFor="senha">
            Senha
          </label>
          <input
            id="senha"
            className="entrada"
            type="password"
            autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
            minLength={8}
            required
            aria-describedby={modo === 'criar' ? 'dica-senha' : undefined}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
          {modo === 'criar' && (
            <span id="dica-senha" className="dica">
              Pelo menos 8 caracteres.
            </span>
          )}
        </div>

        {erro && (
          <p className="mensagem mensagem-erro" role="alert">
            {erro}
          </p>
        )}

        <button className="botao" type="submit" disabled={enviando}>
          {enviando ? 'Um instante…' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}
        </button>
      </form>
    </section>
  )
}
