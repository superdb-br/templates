'use client';

import { useActionState, useState } from 'react';
import { entrarOuCriarConta, type EstadoDoLogin } from './acoes';

type Modo = 'entrar' | 'criar';

export function FormularioEntrar() {
  const [modo, setModo] = useState<Modo>('entrar');
  const [estado, enviar, enviando] = useActionState<EstadoDoLogin, FormData>(entrarOuCriarConta, {
    erro: null,
    email: '',
  });

  return (
    <section className="cartao" aria-labelledby="titulo-entrar">
      <h1 id="titulo-entrar" className="titulo">
        {modo === 'entrar' ? 'Entre para ver suas tarefas' : 'Crie sua conta'}
      </h1>
      <p className="subtitulo">Cada pessoa só enxerga as próprias tarefas.</p>

      <div className="abas" role="tablist" aria-label="Entrar ou criar conta">
        <button type="button" role="tab" className="aba" aria-selected={modo === 'entrar'} onClick={() => setModo('entrar')}>
          Entrar
        </button>
        <button type="button" role="tab" className="aba" aria-selected={modo === 'criar'} onClick={() => setModo('criar')}>
          Criar conta
        </button>
      </div>

      <form className="formulario" action={enviar}>
        <input type="hidden" name="modo" value={modo} />
        <label className="campo">
          <span className="rotulo">E-mail</span>
          <input className="entrada" name="email" type="email" autoComplete="email" required defaultValue={estado.email} />
        </label>
        <div className="campo">
          <label className="rotulo" htmlFor="senha">
            Senha
          </label>
          <input
            id="senha"
            className="entrada"
            name="senha"
            type="password"
            autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
            minLength={8}
            required
            aria-describedby={modo === 'criar' ? 'dica-senha' : undefined}
          />
          {modo === 'criar' && (
            <span id="dica-senha" className="dica">
              Pelo menos 8 caracteres.
            </span>
          )}
        </div>

        {estado.erro && (
          <p className="mensagem mensagem-erro" role="alert">
            {estado.erro}
          </p>
        )}

        <button className="botao" type="submit" disabled={enviando}>
          {enviando ? 'Um instante…' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}
        </button>
      </form>
    </section>
  );
}
