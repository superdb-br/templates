import { exigirSessao, dados } from '../_componentes/sessao';
import { Cabecalho } from '../_componentes/Cabecalho';
import { TIPOS, quando, reais } from '@/lib/modelo';
import { concluirAtividade, criarAtividade, criarContato, criarEmpresa, criarNegocio, moverNegocio } from './acoes';

type Etapa = { id: string; nome: string; ganho: boolean; perdido: boolean };
type Negocio = { id: string; titulo: string; valor_centavos: number; etapa_id: string; contatos: { nome: string } | null };
type Contato = { id: string; nome: string; email: string | null; telefone: string | null; empresas: { nome: string } | null };
type Empresa = { id: string; nome: string };
type Atividade = { id: string; tipo: string; descricao: string; lembrar_em: string | null; negocios: { titulo: string } | null };

export default async function Painel({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { superdb, sessao } = await exigirSessao();
  const { erro } = await searchParams;
  // Na primeira visita, o funil padrão (Novo, Contato feito, Proposta, Ganho, Perdido).
  await dados(superdb.rpc('criar_etapas_padrao'));

  const [etapas, negocios, contatos, empresas, atividades] = await Promise.all([
    dados<Etapa[]>(superdb.from('etapas').select('id, nome, ganho, perdido').order('ordem')),
    dados<Negocio[]>(superdb.from('negocios').select('id, titulo, valor_centavos, etapa_id, contatos(nome)').order('atualizado_em', { ascending: false })),
    dados<Contato[]>(superdb.from('contatos').select('id, nome, email, telefone, empresas(nome)').order('nome')),
    dados<Empresa[]>(superdb.from('empresas').select('id, nome').order('nome')),
    dados<Atividade[]>(superdb.from('atividades').select('id, tipo, descricao, lembrar_em, negocios(titulo)').eq('feita', false).order('lembrar_em', { nullsFirst: false })),
  ]);
  const agora = Date.now();

  return (
    <>
      <Cabecalho email={sessao.user?.email} />
      {erro && <p className="mensagem mensagem-erro mensagem-solta">{erro}</p>}

      <section className="cartao">
        <h1 className="titulo">Funil</h1>
        <div className="grade">
          {etapas.map((e) => {
            const daEtapa = negocios.filter((n) => n.etapa_id === e.id);
            return (
              <div key={e.id}>
                <h2 className="titulo-secao">{e.nome} <span className="etiqueta">{reais(daEtapa.reduce((s, n) => s + n.valor_centavos, 0))}</span></h2>
                <ul className="lista">
                  {daEtapa.map((n) => (
                    <li key={n.id}>
                      <strong>{n.titulo}</strong> · {reais(n.valor_centavos)}{n.contatos && <><br /><span className="dica">{n.contatos.nome}</span></>}
                      <form className="linha" action={moverNegocio}>
                        <input type="hidden" name="id" value={n.id} />
                        <select className="entrada" name="etapa_id" defaultValue={n.etapa_id} aria-label={`Etapa de ${n.titulo}`}>
                          {etapas.map((x) => <option key={x.id} value={x.id}>{x.nome}</option>)}
                        </select>
                        <button className="botao botao-secundario botao-pequeno">Mover</button>
                      </form>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        <form className="linha" action={criarNegocio}>
          <input className="entrada" name="titulo" placeholder="Novo negócio" required maxLength={160} />
          <input className="entrada" name="valor" placeholder="Valor (R$)" inputMode="decimal" />
          <select className="entrada" name="etapa_id" required>{etapas.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}</select>
          <select className="entrada" name="contato_id" defaultValue=""><option value="">Sem contato</option>{contatos.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select>
          <button className="botao botao-pequeno" type="submit">Adicionar</button>
        </form>
      </section>

      <section className="cartao">
        <h2 className="titulo-secao">Atividades e lembretes</h2>
        {atividades.length === 0 ? <p className="vazio">Nada pendente.</p> : (
          <ul className="lista">
            {atividades.map((a) => (
              <li key={a.id} className="linha">
                <span className={a.lembrar_em && new Date(a.lembrar_em).getTime() < agora ? 'etiqueta' : ''}>{TIPOS[a.tipo]}</span>
                <span style={{ flex: 1 }}>{a.descricao}{a.negocios && <span className="dica"> · {a.negocios.titulo}</span>}{a.lembrar_em && <span className="dica"> · {quando(a.lembrar_em)}</span>}</span>
                <form action={concluirAtividade}><input type="hidden" name="id" value={a.id} /><button className="botao botao-secundario botao-pequeno">Feita</button></form>
              </li>
            ))}
          </ul>
        )}
        <form className="linha" action={criarAtividade}>
          <select className="entrada" name="tipo" defaultValue="tarefa">{Object.entries(TIPOS).map(([v, r]) => <option key={v} value={v}>{r}</option>)}</select>
          <input className="entrada" name="descricao" placeholder="O que fazer" required maxLength={2000} />
          <select className="entrada" name="negocio_id" defaultValue=""><option value="">Sem negócio</option>{negocios.map((n) => <option key={n.id} value={n.id}>{n.titulo}</option>)}</select>
          <input className="entrada" name="lembrar_em" type="datetime-local" aria-label="Lembrar em" />
          <button className="botao botao-pequeno" type="submit">Adicionar</button>
        </form>
      </section>

      <section className="cartao">
        <h2 className="titulo-secao">Contatos</h2>
        <table className="tabela">
          <tbody>{contatos.map((c) => <tr key={c.id}><td>{c.nome}</td><td>{c.empresas?.nome}</td><td>{c.email}</td><td>{c.telefone}</td></tr>)}</tbody>
        </table>
        <form className="linha" action={criarContato}>
          <input className="entrada" name="nome" placeholder="Nome" required maxLength={160} />
          <input className="entrada" name="email" type="email" placeholder="E-mail" />
          <input className="entrada" name="telefone" placeholder="Telefone" maxLength={30} />
          <select className="entrada" name="empresa_id" defaultValue=""><option value="">Sem empresa</option>{empresas.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}</select>
          <button className="botao botao-pequeno" type="submit">Adicionar contato</button>
        </form>
        <form className="linha" action={criarEmpresa}>
          <input className="entrada" name="nome" placeholder="Nova empresa" required maxLength={160} />
          <input className="entrada" name="site" placeholder="Site (opcional)" maxLength={200} />
          <button className="botao botao-secundario botao-pequeno" type="submit">Adicionar empresa</button>
        </form>
      </section>
    </>
  );
}
