import { exigirSessao, dados } from '../_componentes/sessao';
import { Cabecalho } from '../_componentes/Cabecalho';
import { DIAS, FUSO, hora, hoje, reais } from '@/lib/modelo';
import { apagarAgendamento, apagarItem, criarHorario, criarProfissional, criarSalao, criarServico, mudarStatus } from './acoes';

type Salao = { id: string; nome: string; codigo_publico: string };
type Servico = { id: string; nome: string; duracao_min: number; preco_centavos: number };
type Profissional = { id: string; nome: string };
type Horario = { id: string; profissional_id: string; dia_semana: number; abre: string; fecha: string };
type Agendamento = {
  id: string; inicio: string; status: string; cliente_nome: string; cliente_telefone: string;
  servicos: { nome: string } | null; profissionais: { nome: string } | null;
};

export default async function Painel({ searchParams }: { searchParams: Promise<{ dia?: string; erro?: string }> }) {
  const { superdb, sessao } = await exigirSessao();
  const { dia: diaPedido, erro } = await searchParams;
  const dia = /^\d{4}-\d{2}-\d{2}$/.test(diaPedido ?? '') ? diaPedido! : hoje();

  const saloes = await dados<Salao[]>(superdb.from('saloes').select('id, nome, codigo_publico').order('criado_em'));
  const salao = saloes[0];

  if (!salao) {
    return (
      <>
        <Cabecalho email={sessao.user?.email} />
        <section className="cartao">
          <h1 className="titulo">Crie o seu salão</h1>
          <p className="subtitulo">Depois você cadastra serviços, profissionais e o expediente, e manda o link aos clientes.</p>
          {erro && <p className="mensagem mensagem-erro">{erro}</p>}
          <form className="formulario" action={criarSalao}>
            <label className="campo">
              <span className="rotulo">Nome do salão</span>
              <input className="entrada" name="nome" required maxLength={120} />
            </label>
            <button className="botao" type="submit">Criar</button>
          </form>
        </section>
      </>
    );
  }

  // O dia inteiro no fuso de Brasília (-03:00).
  const [servicos, profissionais, horarios, agenda] = await Promise.all([
    dados<Servico[]>(superdb.from('servicos').select('id, nome, duracao_min, preco_centavos').eq('salao_id', salao.id).order('nome')),
    dados<Profissional[]>(superdb.from('profissionais').select('id, nome').eq('salao_id', salao.id).order('nome')),
    dados<Horario[]>(superdb.from('horarios').select('id, profissional_id, dia_semana, abre, fecha').order('dia_semana')),
    dados<Agendamento[]>(
      superdb
        .from('agendamentos')
        .select('id, inicio, status, cliente_nome, cliente_telefone, servicos(nome), profissionais(nome)')
        .eq('salao_id', salao.id)
        .gte('inicio', `${dia}T00:00:00-03:00`)
        .lt('inicio', `${dia}T23:59:59-03:00`)
        .order('inicio'),
    ),
  ]);
  const nomeDe = new Map(profissionais.map((p) => [p.id, p.nome]));

  return (
    <>
      <Cabecalho email={sessao.user?.email} titulo={salao.nome} />
      {erro && <p className="mensagem mensagem-erro mensagem-solta">{erro}</p>}

      <section className="cartao">
        <h1 className="titulo">Agenda de {new Date(`${dia}T12:00:00-03:00`).toLocaleDateString('pt-BR', { timeZone: FUSO, dateStyle: 'full' })}</h1>
        <form className="linha" method="get">
          <input className="entrada" type="date" name="dia" defaultValue={dia} />
          <button className="botao botao-secundario botao-pequeno" type="submit">Ver o dia</button>
        </form>
        <p className="dica">
          Link para os clientes marcarem: <a href={`/s/${salao.codigo_publico}`}>/s/{salao.codigo_publico}</a>
        </p>
        {agenda.length === 0 ? (
          <p className="vazio">Nenhum horário marcado neste dia.</p>
        ) : (
          <table className="tabela">
            <thead>
              <tr><th>Hora</th><th>Cliente</th><th>Serviço</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {agenda.map((a) => (
                <tr key={a.id}>
                  <td>{hora(a.inicio)}</td>
                  <td>{a.cliente_nome}<br /><a href={`tel:${a.cliente_telefone}`}>{a.cliente_telefone}</a></td>
                  <td>{a.servicos?.nome}<br /><span className="dica">{a.profissionais?.nome}</span></td>
                  <td>
                    <form className="linha" action={mudarStatus}>
                      <input type="hidden" name="id" value={a.id} />
                      <input type="hidden" name="dia" value={dia} />
                      <select className="entrada" name="status" defaultValue={a.status}>
                        <option value="marcado">marcado</option>
                        <option value="confirmado">confirmado</option>
                        <option value="concluido">concluído</option>
                        <option value="cancelado">cancelado</option>
                      </select>
                      <button className="botao botao-secundario botao-pequeno" type="submit">Salvar</button>
                    </form>
                  </td>
                  <td>
                    <form action={apagarAgendamento}>
                      <input type="hidden" name="id" value={a.id} />
                      <input type="hidden" name="dia" value={dia} />
                      <button className="botao botao-secundario botao-pequeno" type="submit" title="Apaga também o nome e o telefone do cliente">Apagar</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="cartao">
        <h2 className="titulo-secao">Serviços</h2>
        <ul className="lista">
          {servicos.map((s) => (
            <li key={s.id} className="linha">
              <span>{s.nome} · {s.duracao_min} min · {reais(s.preco_centavos)}</span>
              <form action={apagarItem}><input type="hidden" name="tabela" value="servicos" /><input type="hidden" name="id" value={s.id} /><button className="apagar" aria-label={`Apagar ${s.nome}`}>×</button></form>
            </li>
          ))}
        </ul>
        <form className="linha" action={criarServico}>
          <input type="hidden" name="salao_id" value={salao.id} />
          <input className="entrada" name="nome" placeholder="Serviço" required maxLength={120} />
          <input className="entrada" name="duracao_min" type="number" min={5} max={480} step={5} placeholder="Minutos" required />
          <input className="entrada" name="preco" inputMode="decimal" placeholder="Preço (R$)" />
          <button className="botao botao-pequeno" type="submit">Adicionar</button>
        </form>
      </section>

      <section className="cartao">
        <h2 className="titulo-secao">Profissionais e expediente</h2>
        <ul className="lista">
          {profissionais.map((p) => (
            <li key={p.id}>
              <div className="linha">
                <strong>{p.nome}</strong>
                <form action={apagarItem}><input type="hidden" name="tabela" value="profissionais" /><input type="hidden" name="id" value={p.id} /><button className="apagar" aria-label={`Apagar ${p.nome}`}>×</button></form>
              </div>
              <ul>
                {horarios.filter((h) => h.profissional_id === p.id).map((h) => (
                  <li key={h.id} className="linha">
                    <span className="dica">{DIAS[h.dia_semana]}: {h.abre.slice(0, 5)} às {h.fecha.slice(0, 5)}</span>
                    <form action={apagarItem}><input type="hidden" name="tabela" value="horarios" /><input type="hidden" name="id" value={h.id} /><button className="apagar" aria-label="Apagar expediente">×</button></form>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        <form className="linha" action={criarProfissional}>
          <input type="hidden" name="salao_id" value={salao.id} />
          <input className="entrada" name="nome" placeholder="Nome do profissional" required maxLength={120} />
          <button className="botao botao-pequeno" type="submit">Adicionar</button>
        </form>
        {profissionais.length > 0 && (
          <form className="formulario" action={criarHorario}>
            <h3 className="rotulo">Expediente</h3>
            <div className="linha">
              <select className="entrada" name="profissional_id" required>
                {profissionais.map((p) => <option key={p.id} value={p.id}>{nomeDe.get(p.id)}</option>)}
              </select>
              <input className="entrada" type="time" name="abre" defaultValue="09:00" required />
              <input className="entrada" type="time" name="fecha" defaultValue="18:00" required />
            </div>
            <div className="linha">
              {DIAS.map((d, i) => (
                <label key={d} className="linha"><input type="checkbox" name="dia_semana" value={i} defaultChecked={i >= 1 && i <= 5} /> {d}</label>
              ))}
            </div>
            <button className="botao botao-pequeno" type="submit">Salvar expediente</button>
          </form>
        )}
      </section>
    </>
  );
}
