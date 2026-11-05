import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Cabecalho } from '../../_componentes/Cabecalho';
import { traduzirErroDeDados } from '@/lib/superdb/erros';
import { AUTOMATICAS, POR_PAGINA, exibir, mostrar, nomeValido } from '@/lib/modelo';
import { contextoDoPainel } from '../painel';
import { apagar, criar, editar } from './acoes';

type Busca = { q?: string; coluna?: string; pagina?: string; editar?: string; erro?: string };

// Lista, busca e pagina qualquer tabela que o painel enxerga.
export default async function PaginaTabela({ params, searchParams }: { params: Promise<{ tabela: string }>; searchParams: Promise<Busca> }) {
  const { tabela } = await params;
  const busca = await searchParams;
  const { superdb, sessao, papel, tabelas } = await contextoDoPainel();
  if (!papel || !tabelas.includes(tabela)) notFound();

  const pagina = Math.max(1, Number(busca.pagina) || 1);
  let consulta = superdb.from(tabela).select('*', { count: 'exact' });
  if (busca.q && busca.coluna && nomeValido(busca.coluna)) consulta = consulta.ilike(busca.coluna, `%${busca.q}%`);
  const { data, error, count, status } = await consulta.range((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA - 1);
  const erro = busca.erro ?? (error ? traduzirErroDeDados(error, status).message : null);
  const linhas = (data as Record<string, unknown>[] | null) ?? [];
  const colunas = linhas[0] ? Object.keys(linhas[0]) : [];
  const temId = colunas.includes('id');
  const paginas = Math.max(1, Math.ceil((count ?? 0) / POR_PAGINA));
  const emEdicao = busca.editar ? linhas.find((l) => String(l.id) === busca.editar) : undefined;
  const link = (p: number) => `/painel/${tabela}?${new URLSearchParams({ ...(busca.q ? { q: busca.q, coluna: busca.coluna ?? '' } : {}), pagina: String(p) })}`;

  return (
    <>
      <Cabecalho email={sessao.user?.email} />
      <section className="cartao">
        <p className="dica"><Link href="/painel">Tabelas</Link> / {tabela}</p>
        <h1 className="titulo">{tabela}</h1>
        {erro && <p className="mensagem mensagem-erro">{erro}</p>}
        {colunas.length > 0 && (
          <form className="linha" method="get">
            <select className="entrada" name="coluna" defaultValue={busca.coluna ?? colunas.find((c) => c !== 'id')}>
              {colunas.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input className="entrada" name="q" placeholder="Buscar" defaultValue={busca.q ?? ''} />
            <button className="botao botao-secundario botao-pequeno" type="submit">Buscar</button>
          </form>
        )}
        {linhas.length === 0 ? <p className="vazio">Nada para mostrar.</p> : (
          <div className="rolagem">
            <table className="tabela">
              <thead><tr>{colunas.map((c) => <th key={c}>{c}</th>)}{papel === 'admin' && temId && <th></th>}</tr></thead>
              <tbody>
                {linhas.map((l, i) => (
                  <tr key={temId ? String(l.id) : i}>
                    {colunas.map((c) => <td key={c} title={mostrar(l[c])}>{exibir(l[c])}</td>)}
                    {papel === 'admin' && temId && (
                      <td className="linha">
                        <Link className="botao botao-secundario botao-pequeno" href={`/painel/${tabela}?editar=${l.id}&pagina=${pagina}`}>Editar</Link>
                        <form action={apagar}><input type="hidden" name="tabela" value={tabela} /><input type="hidden" name="id" value={String(l.id)} /><button className="apagar" aria-label="Apagar">×</button></form>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="contador">
          {pagina > 1 && <a href={link(pagina - 1)}>Anterior</a>} Página {pagina} de {paginas} ({count ?? 0} linhas) {pagina < paginas && <a href={link(pagina + 1)}>Próxima</a>}
        </p>
      </section>

      {papel === 'admin' && colunas.length > 0 && (
        <section className="cartao">
          <h2 className="titulo-secao">{emEdicao ? 'Editar' : 'Nova linha'}</h2>
          <form className="formulario" action={emEdicao ? editar : criar}>
            <input type="hidden" name="tabela" value={tabela} />
            {emEdicao && <input type="hidden" name="id" value={String(emEdicao.id)} />}
            {colunas.filter((c) => !AUTOMATICAS.has(c)).map((c) => (
              <label key={c} className="campo"><span className="rotulo">{c}</span><input className="entrada" name={`col:${c}`} defaultValue={emEdicao ? mostrar(emEdicao[c]) : ''} /></label>
            ))}
            <button className="botao botao-pequeno" type="submit">Salvar</button>
          </form>
        </section>
      )}
    </>
  );
}
