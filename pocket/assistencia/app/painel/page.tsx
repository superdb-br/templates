import Link from 'next/link';
import { dados } from '../_componentes/sessao';
import { STATUS, TOM, quando } from '@/lib/modelo';
import { abrirOrdem } from './acoes';
import { Balcao, exigirEquipe } from './loja';

type Ordem = { id: string; numero: number; equipamento: string; status: string; aberta_em: string; clientes: { nome: string } | null };
type Cliente = { id: string; nome: string };

export default async function Ordens({ searchParams }: { searchParams: Promise<{ erro?: string; aviso?: string; todas?: string }> }) {
  const { superdb, sessao, membro } = await exigirEquipe();
  const { erro, aviso, todas } = await searchParams;
  if (!membro) return <Balcao sessao={sessao} membro={null}>{null}</Balcao>;

  let consulta = superdb.from('ordens_servico').select('id, numero, equipamento, status, aberta_em, clientes(nome)').order('aberta_em', { ascending: false }).limit(100);
  if (!todas) consulta = consulta.in('status', ['aberta', 'em_andamento', 'pronta']);
  const [ordens, clientes] = await Promise.all([
    dados<Ordem[]>(consulta),
    dados<Cliente[]>(superdb.from('clientes').select('id, nome').order('nome').limit(500)),
  ]);

  return (
    <Balcao sessao={sessao} membro={membro} erro={erro} aviso={aviso}>
      <section className="cartao">
        <h1 className="titulo">{todas ? 'Todas as ordens' : 'Ordens na bancada'}</h1>
        {ordens.length === 0 ? (
          <p className="vazio">Nenhuma ordem {todas ? '' : 'aberta '}ainda.</p>
        ) : (
          <table className="tabela">
            <thead><tr><th scope="col">Nº</th><th scope="col">Cliente</th><th scope="col">Equipamento</th><th scope="col">Status</th><th scope="col">Aberta em</th></tr></thead>
            <tbody>
              {ordens.map((o) => (
                <tr key={o.id}>
                  <td><Link href={`/painel/ordem/${o.id}`}>OS {o.numero}</Link></td>
                  <td>{o.clientes?.nome}</td>
                  <td>{o.equipamento}</td>
                  <td><span className="etiqueta" data-tom={TOM[o.status]}>{STATUS[o.status]}</span></td>
                  <td>{quando(o.aberta_em)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="dica"><a href={todas ? '/painel' : '/painel?todas=1'}>{todas ? 'Ver só as da bancada' : 'Ver todas, inclusive entregues'}</a></p>
      </section>

      <section className="cartao">
        <h2 className="titulo-secao">Nova ordem de serviço</h2>
        {clientes.length === 0 ? (
          <p className="vazio">Cadastre o cliente primeiro, em <Link href="/painel/clientes">Clientes</Link>.</p>
        ) : (
          <form className="formulario" action={abrirOrdem}>
            <select className="entrada" name="cliente_id" required aria-label="Cliente">
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
            <input className="entrada" name="equipamento" placeholder="Equipamento (marca e modelo)" required maxLength={200} />
            <textarea className="entrada" name="defeito" placeholder="Defeito relatado" required maxLength={2000} rows={3} />
            <button className="botao" type="submit">Abrir a ordem</button>
          </form>
        )}
      </section>
    </Balcao>
  );
}
