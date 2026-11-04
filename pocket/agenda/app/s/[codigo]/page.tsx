import { notFound } from 'next/navigation';
import { superdbDoServidor } from '@/lib/superdb/servidor';
import { Cabecalho } from '../../_componentes/Cabecalho';
import { FUSO, hora, hoje, reais } from '@/lib/modelo';
import { marcar } from './acoes';

type AgendaPublica = {
  salao: { nome: string; telefone: string | null };
  servicos: { id: string; nome: string; duracao_min: number; preco_centavos: number }[];
  profissionais: { id: string; nome: string }[];
};

type Busca = { servico?: string; profissional?: string; dia?: string; erro?: string; marcado?: string };

// A página pública do salão: sem login, com a chave anon. Só existe para quem
// tem o código (16 caracteres aleatórios); as tabelas ficam fechadas.
export default async function MarcarHorario({ params, searchParams }: { params: Promise<{ codigo: string }>; searchParams: Promise<Busca> }) {
  const { codigo } = await params;
  const busca = await searchParams;
  const superdb = await superdbDoServidor();

  const { data } = await superdb.rpc('agenda_publica', { p_codigo: codigo });
  const agenda = data as AgendaPublica | null;
  if (!agenda) notFound();

  if (busca.marcado) {
    return (
      <>
        <Cabecalho titulo={agenda.salao.nome} />
        <section className="cartao">
          <h1 className="titulo">Horário marcado</h1>
          <p className="subtitulo">
            {new Date(busca.marcado).toLocaleString('pt-BR', { timeZone: FUSO, dateStyle: 'full', timeStyle: 'short' })}. Até lá!
          </p>
        </section>
      </>
    );
  }

  const servico = agenda.servicos.find((s) => s.id === busca.servico) ?? agenda.servicos[0];
  const profissional = agenda.profissionais.find((p) => p.id === busca.profissional) ?? agenda.profissionais[0];
  const dia = /^\d{4}-\d{2}-\d{2}$/.test(busca.dia ?? '') ? busca.dia! : hoje();

  let livres: string[] = [];
  if (servico && profissional) {
    const r = await superdb.rpc('horarios_livres', { p_codigo: codigo, p_servico: servico.id, p_profissional: profissional.id, p_dia: dia });
    livres = (r.data as string[] | null) ?? [];
  }

  return (
    <>
      <Cabecalho titulo={agenda.salao.nome} />
      <section className="cartao">
        <h1 className="titulo">Marque seu horário</h1>
        {busca.erro && <p className="mensagem mensagem-erro" role="alert">{busca.erro}</p>}
        {!servico || !profissional ? (
          <p className="vazio">Este salão ainda não abriu a agenda.</p>
        ) : (
          <>
            <form className="formulario" method="get">
              <label className="campo">
                <span className="rotulo">Serviço</span>
                <select className="entrada" name="servico" defaultValue={servico.id}>
                  {agenda.servicos.map((s) => (
                    <option key={s.id} value={s.id}>{s.nome} · {s.duracao_min} min · {reais(s.preco_centavos)}</option>
                  ))}
                </select>
              </label>
              <label className="campo">
                <span className="rotulo">Profissional</span>
                <select className="entrada" name="profissional" defaultValue={profissional.id}>
                  {agenda.profissionais.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </label>
              <label className="campo">
                <span className="rotulo">Dia</span>
                <input className="entrada" type="date" name="dia" min={hoje()} defaultValue={dia} />
              </label>
              <button className="botao botao-secundario" type="submit">Ver horários livres</button>
            </form>

            {livres.length === 0 ? (
              <p className="vazio">Nenhum horário livre neste dia.</p>
            ) : (
              <form className="formulario" action={marcar}>
                <input type="hidden" name="codigo" value={codigo} />
                <input type="hidden" name="servico" value={servico.id} />
                <input type="hidden" name="profissional" value={profissional.id} />
                <input type="hidden" name="dia" value={dia} />
                <fieldset className="linha">
                  <legend className="rotulo">Horário</legend>
                  {livres.map((h, i) => (
                    <label key={h} className="etiqueta"><input type="radio" name="inicio" value={h} defaultChecked={i === 0} required /> {hora(h)}</label>
                  ))}
                </fieldset>
                <label className="campo">
                  <span className="rotulo">Seu nome</span>
                  <input className="entrada" name="nome" required maxLength={120} autoComplete="name" />
                </label>
                <label className="campo">
                  <span className="rotulo">Telefone com DDD</span>
                  <input className="entrada" name="telefone" required inputMode="tel" autoComplete="tel" placeholder="11 98888-7777" />
                </label>
                <p className="dica">Usamos o nome e o telefone só para o salão confirmar o horário.</p>
                <button className="botao" type="submit">Marcar</button>
              </form>
            )}
          </>
        )}
      </section>
    </>
  );
}
