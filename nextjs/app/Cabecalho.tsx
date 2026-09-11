import { sair } from './acoes';

/** A marca e, se houver alguém logado, o e-mail e o botão de sair. */
export function Cabecalho({ email }: { email?: string | null }) {
  return (
    <header className="cabecalho">
      <div className="marca">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/favicon.svg" alt="" />
        Tarefas
      </div>
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
