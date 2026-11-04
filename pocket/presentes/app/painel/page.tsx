import { exigirSessao, dados } from '../_componentes/sessao';
import { Cabecalho } from '../_componentes/Cabecalho';
import { reais } from '@/lib/pix/brcode';
import { STATUS } from '@/lib/modelo';
import { apagarContribuicao, criarItem, criarLista, mudarStatus, salvarPix } from './acoes';

type Lista = { id: string; titulo: string; codigo_publico: string; chave_pix: string | null; nome_recebedor: string | null; cidade: string | null };
type Item = { id: string; nome: string; valor_centavos: number; status: string; contribuicoes: { id: string; nome: string; recado: string | null }[] };

export default async function Painel({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { superdb, sessao } = await exigirSessao();
  const { erro } = await searchParams;
  const [lista] = await dados<Lista[]>(superdb.from('listas').select('id, titulo, codigo_publico, chave_pix, nome_recebedor, cidade').order('criado_em').limit(1));

  if (!lista) {
    return (
      <>
        <Cabecalho email={sessao.user?.email} />
        <section className="cartao">
          <h1 className="titulo">Crie a sua lista</h1>
          {erro && <p className="mensagem mensagem-erro">{erro}</p>}
          <form className="formulario" action={criarLista}>
            <input className="entrada" name="titulo" placeholder="Ex.: Casamento da Ana e do Bruno" required maxLength={120} />
            <textarea className="entrada" name="mensagem" placeholder="Mensagem para os convidados" maxLength={1000} rows={3} />
            <button className="botao" type="submit">Criar</button>
          </form>
        </section>
      </>
    );
  }

  const itens = await dados<Item[]>(superdb.from('itens').select('id, nome, valor_centavos, status, contribuicoes(id, nome, recado)').eq('lista_id', lista.id).order('ordem'));
  const recebido = itens.filter((i) => i.status === 'recebido').reduce((s, i) => s + i.valor_centavos, 0);

  return (
    <>
      <Cabecalho email={sessao.user?.email} titulo={lista.titulo} />
      {erro && <p className="mensagem mensagem-erro mensagem-solta">{erro}</p>}
      <section className="cartao">
        <h1 className="titulo">Presentes</h1>
        <p className="dica">Link da lista: <a href={`/l/${lista.codigo_publico}`}>/l/{lista.codigo_publico}</a> · recebido até agora: {reais(recebido)}</p>
        <table className="tabela">
          <thead><tr><th>Presente</th><th>Valor</th><th>Quem deu</th><th>Status</th></tr></thead>
          <tbody>
            {itens.map((i) => (
              <tr key={i.id}>
                <td>{i.nome}</td>
                <td>{reais(i.valor_centavos)}</td>
                <td>
                  {i.contribuicoes.map((c) => (
                    <div key={c.id} className="linha">
                      <span>{c.nome}{c.recado ? `: ${c.recado}` : ''}</span>
                      <form action={apagarContribuicao}><input type="hidden" name="id" value={c.id} /><button className="apagar" aria-label={`Apagar ${c.nome}`}>×</button></form>
                    </div>
                  ))}
                </td>
                <td>
                  <form className="linha" action={mudarStatus}>
                    <input type="hidden" name="id" value={i.id} />
                    <select className="entrada" name="status" defaultValue={i.status}>
                      {Object.entries(STATUS).map(([v, r]) => <option key={v} value={v}>{r}</option>)}
                    </select>
                    <button className="botao botao-secundario botao-pequeno">Salvar</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <form className="linha" action={criarItem}>
          <input type="hidden" name="lista_id" value={lista.id} />
          <input className="entrada" name="nome" placeholder="Presente" required maxLength={120} />
          <input className="entrada" name="valor" placeholder="Valor (R$)" inputMode="decimal" required />
          <input className="entrada" name="descricao" placeholder="Detalhe (opcional)" maxLength={500} />
          <button className="botao botao-pequeno" type="submit">Adicionar</button>
        </form>
      </section>

      <section className="cartao">
        <h2 className="titulo-secao">Seu Pix</h2>
        <form className="formulario" action={salvarPix}>
          <input type="hidden" name="lista_id" value={lista.id} />
          <input className="entrada" name="chave_pix" placeholder="Chave Pix" defaultValue={lista.chave_pix ?? ''} required />
          <div className="linha">
            <input className="entrada" name="nome_recebedor" placeholder="Nome de quem recebe" defaultValue={lista.nome_recebedor ?? ''} required maxLength={60} />
            <input className="entrada" name="cidade" placeholder="Cidade" defaultValue={lista.cidade ?? ''} required maxLength={60} />
          </div>
          <button className="botao botao-pequeno" type="submit">Salvar</button>
        </form>
      </section>
    </>
  );
}
