import Link from 'next/link';
import { Cabecalho } from '../_componentes/Cabecalho';
import { contextoDoPainel } from './painel';

export default async function Painel() {
  const { sessao, papel, tabelas } = await contextoDoPainel();

  if (!papel) {
    return (
      <>
        <Cabecalho email={sessao.user?.email} />
        <section className="cartao">
          <h1 className="titulo">Sem acesso ao painel</h1>
          <p className="subtitulo">
            Peça a um admin o link de convite para o seu e-mail ({sessao.user?.email}) e abra-o com esta conta. É o primeiro
            acesso do projeto? O dono cadastra o primeiro admin no SQL Editor (veja o README do modelo).
          </p>
        </section>
      </>
    );
  }

  return (
    <>
      <Cabecalho email={sessao.user?.email} />
      <section className="cartao">
        <h1 className="titulo">Tabelas</h1>
        <p className="subtitulo">Você é <span className="etiqueta" data-tom="destaque">{papel}</span>. {papel === 'leitor' ? 'Pode ver e buscar.' : 'Pode ver, criar, editar e apagar.'}</p>
        <ul className="lista">
          {tabelas.map((t) => <li key={t} className="linha"><Link href={`/painel/${t}`}><code>{t}</code></Link><Link className="dica" href={`/painel/${t}`}>Abrir</Link></li>)}
        </ul>
        <p className="dica">
          Uma tabela aparece com dados quando as policies dela usam <code>papel_no_painel()</code>. Veja a <code>exemplo_registros</code> no schema.sql.
        </p>
        {papel === 'admin' && <Link className="botao botao-secundario botao-pequeno" href="/painel/equipe">Equipe do painel</Link>}
      </section>
    </>
  );
}
