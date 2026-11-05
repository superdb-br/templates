import { notFound } from 'next/navigation';
import { superdbDoServidor } from '@/lib/superdb/servidor';
import { reais } from '@/lib/pix/brcode';
import { Cabecalho } from '../../_componentes/Cabecalho';
import { pedir } from './acoes';

type Cardapio = {
  loja: { nome: string; aberta: boolean };
  categorias: { id: string; nome: string }[];
  produtos: { id: string; categoria_id: string | null; nome: string; descricao: string | null; preco_centavos: number; foto_url: string | null }[];
};

// O cardápio público: sem login, com a chave anon e o código da loja.
export default async function PaginaCardapio({ params, searchParams }: { params: Promise<{ codigo: string }>; searchParams: Promise<{ erro?: string }> }) {
  const { codigo } = await params;
  const { erro } = await searchParams;
  const superdb = await superdbDoServidor();
  const { data } = await superdb.rpc('cardapio_publico', { p_codigo: codigo });
  const cardapio = data as Cardapio | null;
  if (!cardapio) notFound();

  const grupos = [
    ...cardapio.categorias.map((c) => ({ nome: c.nome, produtos: cardapio.produtos.filter((p) => p.categoria_id === c.id) })),
    { nome: 'Outros', produtos: cardapio.produtos.filter((p) => !cardapio.categorias.some((c) => c.id === p.categoria_id)) },
  ].filter((g) => g.produtos.length > 0);

  return (
    <div className="publico">
      <Cabecalho titulo={cardapio.loja.nome} />
      <form className="cartao formulario" action={pedir}>
        <input type="hidden" name="codigo" value={codigo} />
        <h1 className="titulo">Cardápio</h1>
        <p className="subtitulo">Escolha as quantidades, deixe o nome e o telefone e pague com Pix na hora.</p>
        {!cardapio.loja.aberta && <p className="mensagem mensagem-aviso">A loja não está recebendo pedidos agora.</p>}
        {erro && <p className="mensagem mensagem-erro" role="alert">{erro}</p>}
        {grupos.map((g) => (
          <section key={g.nome}>
            <h2 className="titulo-secao">{g.nome}</h2>
            <ul className="lista">
              {g.produtos.map((p) => (
                <li key={p.id} className="produto" style={p.foto_url ? undefined : { gridTemplateColumns: '1fr auto' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {p.foto_url && <img src={p.foto_url} alt="" width={64} height={64} />}
                  <span>
                    <span className="produto-nome">{p.nome}</span>
                    {p.descricao && <span className="dica">{p.descricao}</span>}
                    <span className="produto-preco">{reais(p.preco_centavos)}</span>
                  </span>
                  <label className="sr-only" htmlFor={`qtd-${p.id}`}>Quantidade de {p.nome}</label>
                  <input id={`qtd-${p.id}`} className="entrada" type="number" min={0} max={99} defaultValue={0} name={`qtd:${p.id}`} />
                </li>
              ))}
            </ul>
          </section>
        ))}
        <label className="campo"><span className="rotulo">Seu nome</span><input className="entrada" name="nome" required maxLength={120} autoComplete="name" /></label>
        <label className="campo"><span className="rotulo">Telefone com DDD</span><input className="entrada" name="telefone" required inputMode="tel" autoComplete="tel" /></label>
        <label className="campo"><span className="rotulo">Observação ou endereço (opcional)</span><textarea className="entrada" name="observacao" maxLength={500} rows={2} /></label>
        <p className="dica">O nome e o telefone vão só para a loja, para combinar a entrega.</p>
        <button className="botao" type="submit" disabled={!cardapio.loja.aberta}>Fazer pedido e pagar com Pix</button>
      </form>
    </div>
  );
}
