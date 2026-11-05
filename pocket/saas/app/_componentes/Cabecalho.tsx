import Link from 'next/link';
import { MODELO } from '@/lib/modelo';
import icone from '@/public/icone.svg';
import { sair } from './acoes-de-login';

/** A marca e, se houver alguém logado, o e-mail e o botão de sair. */
export function Cabecalho({ email, titulo = MODELO.nome }: { email?: string | null; titulo?: string }) {
  return (
    <header className="cabecalho">
      <Link className="marca" href="/">
        {/* O ícone do app (public/icone.svg): troque pelo da sua marca. Importado,
            e não por "/icone.svg", para o endereço seguir o basePath. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={icone.src} alt="" width={34} height={34} />
        <span>{titulo}</span>
      </Link>
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
