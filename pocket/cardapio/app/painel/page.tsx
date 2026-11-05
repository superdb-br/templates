import Link from 'next/link';
import { exigirSessao, dados } from '../_componentes/sessao';
import { Cabecalho } from '../_componentes/Cabecalho';
import { reais } from '@/lib/pix/brcode';
import { STATUS, TOM, telefone } from '@/lib/modelo';
import { alternarProduto, apagarPedido, criarCategoria, criarLoja, criarProduto, mudarStatus, salvarPix } from './acoes';

type Loja = { id: string; nome: string; codigo_publico: string; chave_pix: string | null; nome_recebedor: string | null; cidade: string | null; aberta: boolean };
type Categoria = { id: string; nome: string };
type Produto = { id: string; nome: string; preco_centavos: number; ativo: boolean; categoria_id: string | null };
type Pedido = {
  id: string; criado_em: string; status: string; cliente_nome: string; cliente_telefone: string; observacao: string | null;
  total_centavos: number; itens_pedido: { nome: string; quantidade: number }[];
};

export default async function Painel({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { superdb, sessao } = await exigirSessao();
  const { erro } = await searchParams;
  const [loja] = await dados<Loja[]>(superdb.from('config_loja').select('*').order('criado_em').limit(1));

  if (!loja) {
    return (
      <>
        <Cabecalho email={sessao.user?.email} />
        <section className="cartao">
          <h1 className="titulo">Crie a sua loja</h1>
          {erro && <p className="mensagem mensagem-erro">{erro}</p>}
          <form className="formulario" action={criarLoja}>
            <label className="campo"><span className="rotulo">Nome da loja</span><input className="entrada" name="nome" required maxLength={120} /></label>
            <button className="botao" type="submit">Criar</button>
          </form>
        </section>
      </>
    );
  }

  const [categorias, produtos, pedidos] = await Promise.all([
    dados<Categoria[]>(superdb.from('categorias').select('id, nome').eq('loja_id', loja.id).order('ordem')),
    dados<Produto[]>(superdb.from('produtos').select('id, nome, preco_centavos, ativo, categoria_id').eq('loja_id', loja.id).order('nome')),
    dados<Pedido[]>(
      superdb.from('pedidos').select('id, criado_em, status, cliente_nome, cliente_telefone, observacao, total_centavos, itens_pedido(nome, quantidade)')
        .eq('loja_id', loja.id).order('criado_em', { ascending: false }).limit(50),
    ),
  ]);

  return (
    <>
      <Cabecalho email={sessao.user?.email} titulo={loja.nome} />
      {erro && <p className="mensagem mensagem-erro mensagem-solta">{erro}</p>}

      <section className="cartao">
        <h1 className="titulo">Pedidos</h1>
        <p className="dica">
          Link do cardápio: <Link href={`/c/${loja.codigo_publico}`}>/c/{loja.codigo_publico}</Link>
          {' · '}{loja.aberta ? 'recebendo pedidos' : 'fechada para pedidos'}
        </p>
        <div className="resumo">
          <div><p className="numero-grande">{pedidos.filter((p) => p.status === 'aguardando').length}</p><p className="dica">esperando o Pix</p></div>
          <div><p className="numero-grande">{pedidos.filter((p) => p.status === 'confirmado').length}</p><p className="dica">pagos, a preparar</p></div>
          <div><p className="numero-grande">{reais(pedidos.filter((p) => p.status !== 'cancelado').reduce((s, p) => s + p.total_centavos, 0))}</p><p className="dica">em pedidos</p></div>
        </div>
        {pedidos.length === 0 ? <p className="vazio">Nenhum pedido ainda.</p> : (
          <table className="tabela">
            <thead><tr><th>Quando</th><th>Cliente</th><th>Itens</th><th>Total</th><th>Status</th><th><span className="sr-only">Apagar</span></th></tr></thead>
            <tbody>
              {pedidos.map((p) => (
                <tr key={p.id}>
                  <td>{new Date(p.criado_em).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                  <td>{p.cliente_nome}<br /><a href={`tel:${p.cliente_telefone}`}>{telefone(p.cliente_telefone)}</a>{p.observacao && <><br /><span className="dica">{p.observacao}</span></>}</td>
                  <td>{p.itens_pedido.map((i) => `${i.quantidade}× ${i.nome}`).join(', ')}</td>
                  <td><strong>{reais(p.total_centavos)}</strong></td>
                  <td>
                    <span className="etiqueta" data-tom={TOM[p.status]}>{STATUS[p.status] ?? p.status}</span>
                    <form className="linha" action={mudarStatus}>
                      <input type="hidden" name="id" value={p.id} />
                      <select className="entrada" name="status" defaultValue={p.status}>
                        {Object.entries(STATUS).map(([v, r]) => <option key={v} value={v}>{r}</option>)}
                      </select>
                      <button className="botao botao-secundario botao-pequeno" type="submit">Salvar</button>
                    </form>
                  </td>
                  <td><form action={apagarPedido}><input type="hidden" name="id" value={p.id} /><button className="apagar" aria-label={`Apagar o pedido de ${p.cliente_nome}`} title="Apaga também o nome e o telefone do cliente">×</button></form></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="cartao">
        <h2 className="titulo-secao">Pix e funcionamento</h2>
        <form className="formulario" action={salvarPix}>
          <input type="hidden" name="loja_id" value={loja.id} />
          <label className="campo"><span className="rotulo">Chave Pix</span><input className="entrada" name="chave_pix" defaultValue={loja.chave_pix ?? ''} required /></label>
          <div className="linha">
            <input className="entrada" name="nome_recebedor" placeholder="Nome de quem recebe" defaultValue={loja.nome_recebedor ?? ''} required maxLength={60} />
            <input className="entrada" name="cidade" placeholder="Cidade" defaultValue={loja.cidade ?? ''} required maxLength={60} />
          </div>
          <label className="linha"><input type="checkbox" name="aberta" defaultChecked={loja.aberta} /> Recebendo pedidos</label>
          <button className="botao botao-pequeno" type="submit">Salvar</button>
        </form>
      </section>

      <section className="cartao">
        <h2 className="titulo-secao">Cardápio</h2>
        <ul className="lista">
          {produtos.map((p) => (
            <li key={p.id} className="linha">
              <span>{p.nome} · {reais(p.preco_centavos)} {!p.ativo && <span className="etiqueta">fora do cardápio</span>}</span>
              <form action={alternarProduto}>
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="ativo" value={String(!p.ativo)} />
                <button className="botao botao-secundario botao-pequeno">{p.ativo ? 'Tirar' : 'Voltar'}</button>
              </form>
            </li>
          ))}
        </ul>
        <form className="formulario" action={criarProduto}>
          <input type="hidden" name="loja_id" value={loja.id} />
          <div className="linha">
            <input className="entrada" name="nome" placeholder="Produto" required maxLength={120} />
            <input className="entrada" name="preco" placeholder="Preço (R$)" inputMode="decimal" required />
            <select className="entrada" name="categoria_id" defaultValue="">
              <option value="">Sem categoria</option>
              {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <input className="entrada" name="descricao" placeholder="Descrição (opcional)" maxLength={500} />
          <input className="entrada" name="foto_url" placeholder="Endereço da foto, https://... (opcional)" />
          <button className="botao botao-pequeno" type="submit">Adicionar produto</button>
        </form>
        <form className="linha" action={criarCategoria}>
          <input type="hidden" name="loja_id" value={loja.id} />
          <input className="entrada" name="nome" placeholder="Nova categoria" required maxLength={80} />
          <button className="botao botao-secundario botao-pequeno" type="submit">Adicionar categoria</button>
        </form>
      </section>
    </>
  );
}
