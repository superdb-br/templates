import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { superdbDoServidor } from '@/lib/superdb/servidor';
import { PagarComPix } from '@/lib/pix/PagarComPix';
import { reais } from '@/lib/pix/brcode';
import { STATUS } from '@/lib/modelo';
import { Cabecalho } from '../../_componentes/Cabecalho';

type PedidoPublico = {
  status: string;
  total_centavos: number;
  loja: { nome: string; chave_pix: string | null; nome_recebedor: string | null; cidade: string | null };
  itens: { nome: string; quantidade: number; preco_centavos: number }[];
};

// O cliente acompanha o pedido pelo id (aleatório) que recebeu ao pedir.
export default async function PaginaPedido({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const superdb = await superdbDoServidor();
  const { data } = await superdb.rpc('pedido_publico', { p_id: id });
  const pedido = data as PedidoPublico | null;
  if (!pedido) notFound();

  return (
    <div className="publico">
      <Cabecalho titulo={pedido.loja.nome} />
      <section className="cartao">
        <h1 className="titulo">{STATUS[pedido.status] ?? pedido.status}</h1>
        <ul className="lista">
          {pedido.itens.map((i, n) => (
            <li key={n} className="linha"><span>{i.quantidade}× {i.nome}</span><strong>{reais(i.preco_centavos * i.quantidade)}</strong></li>
          ))}
        </ul>
        {pedido.status === 'aguardando' && (
          <PagarComPix
            chave={pedido.loja.chave_pix}
            nome={pedido.loja.nome_recebedor}
            cidade={pedido.loja.cidade}
            valorCentavos={pedido.total_centavos}
            txid={id.replace(/-/g, '').slice(0, 25)}
          />
        )}
        <p className="dica">Guarde este endereço para acompanhar o pedido.</p>
      </section>
    </div>
  );
}
