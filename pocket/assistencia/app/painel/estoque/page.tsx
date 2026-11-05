import { dados } from '../../_componentes/sessao';
import { reais } from '@/lib/modelo';
import { cadastrarItem, movimentarEstoque, mudarPreco } from '../acoes';
import { Balcao, exigirEquipe } from '../loja';

type DoCatalogo = { id: string; sku: string; nome: string; tipo: string; preco_centavos: number; estoque: number; estoque_minimo: number };
type Baixo = { id: string; sku: string; nome: string; estoque: number; estoque_minimo: number };

export default async function Estoque({ searchParams }: { searchParams: Promise<{ erro?: string; aviso?: string }> }) {
  const { superdb, sessao, membro } = await exigirEquipe();
  const { erro, aviso } = await searchParams;
  if (!membro) return <Balcao sessao={sessao} membro={null}>{null}</Balcao>;
  const dono = membro.papel === 'dono';
  const [catalogo, baixo] = await Promise.all([
    dados<DoCatalogo[]>(superdb.from('catalogo').select('id, sku, nome, tipo, preco_centavos, estoque, estoque_minimo').order('tipo').order('nome')),
    dados<Baixo[]>(superdb.from('estoque_baixo').select('id, sku, nome, estoque, estoque_minimo').order('nome')),
  ]);

  return (
    <Balcao sessao={sessao} membro={membro} erro={erro} aviso={aviso}>
      <section className="cartao">
        <h1 className="titulo">O que comprar</h1>
        {baixo.length === 0 ? <p className="vazio">Nenhuma peça abaixo do mínimo.</p> : (
          <ul className="lista">
            {baixo.map((b) => <li key={b.id}><strong>{b.nome}</strong> <span className="dica">{b.sku}</span> · {b.estoque} em estoque, mínimo {b.estoque_minimo}</li>)}
          </ul>
        )}
      </section>

      <section className="cartao">
        <h2 className="titulo-secao">Peças e serviços</h2>
        <p className="dica">O estoque só muda pela entrega da ordem ou por compra e ajuste lançados pelo dono, e nunca fica negativo.</p>
        <table className="tabela">
          <thead><tr><th scope="col">Item</th><th scope="col">Preço</th><th scope="col">Estoque</th>{dono && <th scope="col">Dono</th>}</tr></thead>
          <tbody>
            {catalogo.map((c) => (
              <tr key={c.id}>
                <td>{c.nome} <span className="dica">{c.sku} · {c.tipo === 'peca' ? 'peça' : 'serviço'}</span></td>
                <td>{reais(c.preco_centavos)}</td>
                <td>{c.tipo === 'peca' ? c.estoque : '·'}</td>
                {dono && (
                  <td>
                    <form className="linha" action={mudarPreco}>
                      <input type="hidden" name="id" value={c.id} />
                      <input className="entrada" name="preco" placeholder="Novo preço" inputMode="decimal" aria-label={`Novo preço de ${c.nome}`} required />
                      <button className="botao botao-secundario botao-pequeno">Preço</button>
                    </form>
                    {c.tipo === 'peca' && (
                      <form className="linha" action={movimentarEstoque}>
                        <input type="hidden" name="id" value={c.id} />
                        <input className="entrada" name="quantidade" type="number" placeholder="Qtd." aria-label={`Quantidade de ${c.nome}`} required />
                        <select className="entrada" name="motivo" aria-label="Motivo">
                          <option value="compra">Compra (entra)</option>
                          <option value="ajuste">Ajuste de inventário (+ ou -)</option>
                        </select>
                        <button className="botao botao-secundario botao-pequeno">Lançar</button>
                      </form>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {dono && (
        <section className="cartao">
          <h2 className="titulo-secao">Cadastrar peça ou serviço</h2>
          <form className="formulario" action={cadastrarItem}>
            <div className="linha">
              <input className="entrada" name="sku" placeholder="Código (SKU)" required maxLength={40} />
              <input className="entrada" name="nome" placeholder="Nome" required maxLength={160} />
            </div>
            <div className="linha">
              <select className="entrada" name="tipo" aria-label="Tipo">
                <option value="peca">Peça (tem estoque)</option>
                <option value="servico">Serviço (mão de obra, vai na NFS-e)</option>
              </select>
              <input className="entrada" name="preco" placeholder="Preço (R$)" inputMode="decimal" required />
              <input className="entrada" name="estoque_minimo" type="number" min={0} placeholder="Estoque mínimo" />
            </div>
            <p className="dica">A peça nasce com estoque zero: lance a compra depois, para cada unidade ter o movimento registrado.</p>
            <button className="botao" type="submit">Cadastrar</button>
          </form>
        </section>
      )}
    </Balcao>
  );
}
