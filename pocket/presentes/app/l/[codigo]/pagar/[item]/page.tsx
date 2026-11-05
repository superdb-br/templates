import Link from 'next/link';
import { notFound } from 'next/navigation';
import { superdbDoServidor } from '@/lib/superdb/servidor';
import { PagarComPix } from '@/lib/pix/PagarComPix';
import { Cabecalho } from '../../../../_componentes/Cabecalho';
import type { ListaPublica } from '../../page';

// Depois de escolher: o Pix com o valor do presente, lido do banco (não da URL).
export default async function PagarPresente({ params }: { params: Promise<{ codigo: string; item: string }> }) {
  const { codigo, item } = await params;
  const superdb = await superdbDoServidor();
  const { data } = await superdb.rpc('lista_publica', { p_codigo: codigo });
  const lista = data as ListaPublica | null;
  const presente = lista?.itens.find((i) => i.id === item);
  if (!lista || !presente) notFound();

  return (
    <div className="publico">
      <Cabecalho titulo={lista.lista.titulo} />
      <section className="cartao">
        <h1 className="titulo">Obrigado! Agora é só pagar o Pix</h1>
        <p className="subtitulo">{presente.nome}</p>
        <PagarComPix chave={lista.pix.chave} nome={lista.pix.nome} cidade={lista.pix.cidade} valorCentavos={presente.valor_centavos} />
        <Link className="botao botao-secundario" href={`/l/${codigo}`}>Voltar à lista</Link>
      </section>
    </div>
  );
}
