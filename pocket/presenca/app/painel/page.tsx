import { exigirSessao, dados } from '../_componentes/sessao';
import { Cabecalho } from '../_componentes/Cabecalho';
import { quando } from '@/lib/modelo';
import { alternarRespostas, apagarResposta, criarEvento } from './acoes';

type Evento = { id: string; titulo: string; quando: string; local: string | null; codigo_publico: string; aceita_respostas: boolean };
type Resposta = { id: string; nome: string; vai: boolean; quantidade: number; recado: string | null; criado_em: string };

export default async function Painel({ searchParams }: { searchParams: Promise<{ evento?: string; erro?: string }> }) {
  const { superdb, sessao } = await exigirSessao();
  const busca = await searchParams;
  const eventos = await dados<Evento[]>(superdb.from('eventos').select('id, titulo, quando, local, codigo_publico, aceita_respostas').order('quando'));
  const evento = eventos.find((e) => e.id === busca.evento) ?? eventos[0];
  const respostas = evento
    ? await dados<Resposta[]>(superdb.from('convidados_resposta').select('id, nome, vai, quantidade, recado, criado_em').eq('evento_id', evento.id).order('criado_em'))
    : [];
  const vao = respostas.filter((r) => r.vai);

  return (
    <>
      <Cabecalho email={sessao.user?.email} />
      {busca.erro && <p className="mensagem mensagem-erro mensagem-solta">{busca.erro}</p>}

      {evento && (
        <section className="cartao">
          <h1 className="titulo">{evento.titulo}</h1>
          <p className="subtitulo">{quando(evento.quando)}{evento.local ? ` · ${evento.local}` : ''}</p>
          <p className="dica">Link do convite: <a href={`/e/${evento.codigo_publico}`}>/e/{evento.codigo_publico}</a></p>
          <div className="grade">
            <div><p className="numero-grande">{vao.reduce((s, r) => s + r.quantidade, 0)}</p><p className="dica">pessoas confirmadas</p></div>
            <div><p className="numero-grande">{vao.length}</p><p className="dica">respostas &quot;vou&quot;</p></div>
            <div><p className="numero-grande">{respostas.length - vao.length}</p><p className="dica">não vão</p></div>
          </div>
          <div className="acoes">
            <a className="botao botao-secundario botao-pequeno" href={`/painel/csv/${evento.id}`}>Baixar CSV</a>
            <form action={alternarRespostas}>
              <input type="hidden" name="id" value={evento.id} />
              <input type="hidden" name="aceita" value={String(!evento.aceita_respostas)} />
              <button className="botao botao-secundario botao-pequeno">{evento.aceita_respostas ? 'Encerrar confirmações' : 'Reabrir confirmações'}</button>
            </form>
          </div>
          {respostas.length === 0 ? <p className="vazio">Ninguém respondeu ainda.</p> : (
            <table className="tabela">
              <thead><tr><th>Nome</th><th>Vai?</th><th>Pessoas</th><th>Recado</th><th></th></tr></thead>
              <tbody>
                {respostas.map((r) => (
                  <tr key={r.id}>
                    <td>{r.nome}</td><td>{r.vai ? 'Sim' : 'Não'}</td><td>{r.quantidade}</td><td>{r.recado}</td>
                    <td><form action={apagarResposta}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="evento" value={evento.id} /><button className="apagar" aria-label={`Apagar a resposta de ${r.nome}`}>×</button></form></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {eventos.length > 1 && (
        <section className="cartao">
          <h2 className="titulo-secao">Seus eventos</h2>
          <ul className="lista">{eventos.map((e) => <li key={e.id}><a href={`/painel?evento=${e.id}`}>{e.titulo}</a> · {quando(e.quando)}</li>)}</ul>
        </section>
      )}

      <section className="cartao">
        <h2 className="titulo-secao">Novo evento</h2>
        <form className="formulario" action={criarEvento}>
          <input className="entrada" name="titulo" placeholder="Nome do evento" required maxLength={120} />
          <input className="entrada" name="quando" type="datetime-local" required />
          <input className="entrada" name="local" placeholder="Local" maxLength={200} />
          <textarea className="entrada" name="descricao" placeholder="Detalhes para os convidados" maxLength={1000} rows={3} />
          <button className="botao botao-pequeno" type="submit">Criar evento</button>
        </form>
      </section>
    </>
  );
}
