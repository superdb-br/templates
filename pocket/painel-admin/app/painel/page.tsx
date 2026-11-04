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
        <p className="subtitulo">Você é <span className="etiqueta">{papel}</span>. {papel === 'leitor' ? 'Pode ver e buscar.' : 'Pode ver, criar, editar e apagar.'}</p>
        <ul className="lista">
          {tabelas.map((t) => <li key={t}><a href={`/painel/${t}`}>{t}</a></li>)}
        </ul>
        <p className="dica">
          Uma tabela aparece com dados quando as policies dela usam <code>papel_no_painel()</code>. Veja a <code>exemplo_registros</code> no schema.sql.
        </p>
        {papel === 'admin' && <a className="botao botao-secundario botao-pequeno" href="/painel/equipe">Equipe do painel</a>}
      </section>
    </>
  );
}
