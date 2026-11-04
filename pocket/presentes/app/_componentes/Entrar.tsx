'use client';

import { useActionState, useState } from 'react';
import { entrarOuCriarConta, type EstadoDoLogin } from './acoes-de-login';

type Modo = 'entrar' | 'criar';

/** Login e cadastro do dono do app, por e-mail e senha. */
export function Entrar({ titulo, subtitulo }: { titulo: string; subtitulo: string }) {
  const [modo, setModo] = useState<Modo>('entrar');
  const [estado, enviar, enviando] = useActionState<EstadoDoLogin, FormData>(entrarOuCriarConta, {
    erro: null,
    email: '',
  });

  return (
    <section className="cartao" aria-labelledby="titulo-entrar">
      <h1 id="titulo-entrar" className="titulo">
        {modo === 'entrar' ? titulo : 'Crie sua conta'}
      </h1>
      <p className="subtitulo">{subtitulo}</p>

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
        <label className="campo">
          <span className="rotulo">Senha</span>
          <input
            className="entrada"
            name="senha"
            type="password"
            autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
            minLength={8}
            required
          />
          {modo === 'criar' && <span className="dica">Pelo menos 8 caracteres.</span>}
        </label>

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
