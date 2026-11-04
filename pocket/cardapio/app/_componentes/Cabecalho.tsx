import { MODELO } from '@/lib/modelo';
import { sair } from './acoes-de-login';

/** A marca e, se houver alguém logado, o e-mail e o botão de sair. */
export function Cabecalho({ email, titulo = MODELO.nome }: { email?: string | null; titulo?: string }) {
  return (
    <header className="cabecalho">
      <a className="marca" href="/">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/favicon.svg" alt="" />
        {titulo}
      </a>
      {email && (
        <div className="quem">
          <span>{email}</span>
          <form action={sair}>
            <button className="botao botao-secundario botao-pequeno" type="submit">
              Sair
            </button>
          </form>
        </div>
      )}
    </header>
  );
}
