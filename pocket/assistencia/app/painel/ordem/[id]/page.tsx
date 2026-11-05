import Link from 'next/link';
import { dados } from '../../../_componentes/sessao';
import { STATUS, TOM, STATUS_DA_BANCADA, quando, reais } from '@/lib/modelo';
import { fiscalConfigurada } from '@/lib/fiscal';
import { emitirNota, entregar, lancarItem, mudarStatus, tirarItem } from '../../acoes';
import { Balcao, exigirEquipe } from '../../loja';

type Ordem = {
  id: string; numero: number; equipamento: string; defeito: string; status: string;
  total_pecas_centavos: number; total_servicos_centavos: number; aberta_em: string; entregue_em: string | null;
  nfse_id: string | null; nfse_situacao: string | null; nfse_ambiente: string | null; nfse_numero: string | null;
  clientes: { nome: string; documento: string | null; endereco: unknown } | null;
};
type Item = { id: string; quantidade: number; preco_unitario_centavos: number; catalogo: { sku: string; nome: string; tipo: string } | null };
type DoCatalogo = { id: string; sku: string; nome: string; tipo: string; preco_centavos: number; estoque: number };

export default async function PaginaDaOrdem({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ erro?: string; aviso?: string }> }) {
  const { superdb, sessao, membro } = await exigirEquipe();
  const { id } = await params;
  const { erro, aviso } = await searchParams;
  if (!membro) return <Balcao sessao={sessao} membro={null}>{null}</Balcao>;

  const [ordem, itens, catalogo] = await Promise.all([
    dados<Ordem | null>(
      superdb.from('ordens_servico')
        .select('id, numero, equipamento, defeito, status, total_pecas_centavos, total_servicos_centavos, aberta_em, entregue_em, nfse_id, nfse_situacao, nfse_ambiente, nfse_numero, clientes(nome, documento, endereco)')
        .eq('id', id).maybeSingle(),
    ),
    dados<Item[]>(superdb.from('itens_ordem').select('id, quantidade, preco_unitario_centavos, catalogo(sku, nome, tipo)').eq('ordem_id', id)),
    dados<DoCatalogo[]>(superdb.from('catalogo').select('id, sku, nome, tipo, preco_centavos, estoque').order('nome')),
  ]);
  if (!ordem) {
    return <Balcao sessao={sessao} membro={membro} erro="Ordem não encontrada."><p><Link href="/painel">Voltar às ordens</Link></p></Balcao>;
  }
  const fechada = ordem.status === 'entregue' || ordem.status === 'cancelada';
  const soma = (tipo: string) => itens.filter((i) => i.catalogo?.tipo === tipo).reduce((s, i) => s + i.quantidade * Number(i.preco_unitario_centavos), 0);
  const servicos = fechada ? Number(ordem.total_servicos_centavos) : soma('servico');
  const pecas = fechada ? Number(ordem.total_pecas_centavos) : soma('peca');
  const notaDeTeste = ordem.nfse_ambiente !== 'producao';

  return (
    <Balcao sessao={sessao} membro={membro} erro={erro} aviso={aviso}>
      <section className="cartao">
        <p className="dica"><Link href="/painel">← Ordens</Link></p>
        <h1 className="titulo">OS {ordem.numero} <span className="etiqueta" data-tom={TOM[ordem.status]}>{STATUS[ordem.status]}</span></h1>
        <p className="subtitulo">
          {ordem.clientes?.nome} · {ordem.equipamento} · aberta em {quando(ordem.aberta_em)}
          {ordem.entregue_em && <> · entregue em {quando(ordem.entregue_em)}</>}
        </p>
        <p className="mensagem mensagem-aviso mensagem-solta">Defeito relatado: {ordem.defeito}</p>

        <h2 className="titulo-secao">Peças e serviços</h2>
        {itens.length === 0 ? <p className="vazio">Nenhum item ainda.</p> : (
          <table className="tabela">
            <thead><tr><th scope="col">Item</th><th scope="col">Qtd.</th><th scope="col">Preço de tabela</th><th scope="col">Total</th>{!fechada && <th scope="col"><span className="dica">Tirar</span></th>}</tr></thead>
            <tbody>
              {itens.map((i) => (
                <tr key={i.id}>
                  <td>{i.catalogo?.nome} <span className="dica">{i.catalogo?.tipo === 'peca' ? 'peça' : 'serviço'}</span></td>
                  <td>{i.quantidade}</td>
                  <td>{reais(i.preco_unitario_centavos)}</td>
                  <td>{reais(i.quantidade * Number(i.preco_unitario_centavos))}</td>
                  {!fechada && (
                    <td>
                      <form action={tirarItem}>
                        <input type="hidden" name="ordem_id" value={ordem.id} />
                        <input type="hidden" name="id" value={i.id} />
                        <button className="botao botao-secundario botao-pequeno" aria-label={`Tirar ${i.catalogo?.nome}`}>Tirar</button>
                      </form>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="resumo">
          <div><p className="numero-grande">{reais(pecas)}</p><p className="dica">em peças</p></div>
          <div><p className="numero-grande">{reais(servicos)}</p><p className="dica">em serviço (vai na NFS-e)</p></div>
          <div><p className="numero-grande">{reais(pecas + servicos)}</p><p className="dica">total da ordem</p></div>
        </div>

        {!fechada && (
          <form className="linha" action={lancarItem}>
            <input type="hidden" name="ordem_id" value={ordem.id} />
            <select className="entrada" name="item_id" required aria-label="Peça ou serviço">
              {catalogo.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} · {reais(c.preco_centavos)}{c.tipo === 'peca' ? ` · ${c.estoque} em estoque` : ''}
                </option>
              ))}
            </select>
            <input className="entrada" name="quantidade" type="number" min={1} max={999} defaultValue={1} aria-label="Quantidade" style={{ flex: '0 0 90px' }} />
            <button className="botao botao-pequeno" type="submit">Lançar</button>
          </form>
        )}
      </section>

      {!fechada && (
        <section className="cartao">
          <h2 className="titulo-secao">Andamento</h2>
          <form className="linha" action={mudarStatus}>
            <input type="hidden" name="ordem_id" value={ordem.id} />
            <select className="entrada" name="status" defaultValue={ordem.status} aria-label="Status da ordem">
              {STATUS_DA_BANCADA.map((s) => <option key={s} value={s}>{STATUS[s]}</option>)}
              <option value="cancelada">Cancelar a ordem</option>
            </select>
            <button className="botao botao-secundario botao-pequeno" type="submit">Mudar</button>
          </form>
          <form action={entregar} style={{ marginTop: 12 }}>
            <input type="hidden" name="ordem_id" value={ordem.id} />
            <button className="botao" type="submit">Entregar ao cliente{servicos > 0 && fiscalConfigurada ? ' e emitir a NFS-e' : ''}</button>
            <p className="dica">Baixa as peças do estoque e fecha a ordem. Faltou peça: nada baixa e a ordem continua aberta.</p>
          </form>
        </section>
      )}

      {ordem.status === 'entregue' && servicos > 0 && (
        <section className="cartao">
          <h2 className="titulo-secao">Nota fiscal de serviço (NFS-e)</h2>
          {ordem.nfse_id ? (
            <>
              <p>
                Situação: <strong>{ordem.nfse_situacao}</strong>
                {ordem.nfse_numero && <> · número {ordem.nfse_numero}</>}
              </p>
              {notaDeTeste && (
                <p className="mensagem mensagem-aviso">Nota de teste, sem valor fiscal (homologação). Emitir de verdade pede o plano Pro do SuperDB.</p>
              )}
            </>
          ) : (
            <p className="vazio">A nota ainda não saiu.</p>
          )}
          {!fiscalConfigurada ? (
            <p className="dica">Para emitir, defina <code>SUPERDB_SERVICE_ROLE_KEY</code> nas variáveis do servidor e ative o SuperDB Fiscal no painel (veja o README).</p>
          ) : (
            <form action={emitirNota}>
              <input type="hidden" name="ordem_id" value={ordem.id} />
              <button className="botao botao-secundario botao-pequeno" type="submit">{ordem.nfse_id ? 'Atualizar a situação' : 'Emitir a nota'}</button>
            </form>
          )}
          <p className="dica">A NFS-e é da mão de obra. Peça vendida é mercadoria (NF-e, com ICMS), que o SuperDB não emite.</p>
        </section>
      )}
    </Balcao>
  );
}
