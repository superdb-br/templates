import { notFound, redirect } from 'next/navigation';
import { superdbDoServidor } from '@/lib/superdb/servidor';
import { Cabecalho } from '../../_componentes/Cabecalho';
import { ERROS, quando } from '@/lib/modelo';

type Convite = { titulo: string; quando: string; local: string | null; descricao: string | null; aceita_respostas: boolean };

async function responder(f: FormData) {
  'use server';
  const v = (k: string) => String(f.get(k) ?? '').trim();
  const codigo = v('codigo');
  const vai = v('vai') === 'sim';
  const superdb = await superdbDoServidor();
  const { error } = await superdb.rpc('responder_presenca', {
    p_codigo: codigo,
    p_nome: v('nome'),
    p_vai: vai,
    p_quantidade: vai ? Number(v('quantidade')) : 0,
    p_recado: v('recado'),
  });
  if (error) redirect(`/e/${encodeURIComponent(codigo)}?erro=${encodeURIComponent(ERROS[error.message ?? ''] ?? 'Não deu para responder agora.')}`);
  redirect(`/e/${encodeURIComponent(codigo)}?respondido=${vai ? 'sim' : 'nao'}`);
}

// O convite público: sem login, com a chave anon e o código do evento.
export default async function PaginaConvite({ params, searchParams }: { params: Promise<{ codigo: string }>; searchParams: Promise<{ erro?: string; respondido?: string }> }) {
  const { codigo } = await params;
  const busca = await searchParams;
  const superdb = await superdbDoServidor();
  const { data } = await superdb.rpc('evento_publico', { p_codigo: codigo });
  const convite = data as Convite | null;
  if (!convite) notFound();

  return (
    <>
      <Cabecalho titulo={convite.titulo} />
      <section className="cartao">
        <h1 className="titulo">{convite.titulo}</h1>
        <p className="subtitulo">{quando(convite.quando)}{convite.local ? ` · ${convite.local}` : ''}</p>
        {convite.descricao && <p>{convite.descricao}</p>}
        {busca.respondido ? (
          <p className="mensagem">{busca.respondido === 'sim' ? 'Presença confirmada. Até lá!' : 'Resposta registrada. Obrigado por avisar!'}</p>
        ) : !convite.aceita_respostas ? (
          <p className="mensagem mensagem-aviso">As confirmações foram encerradas.</p>
        ) : (
          <form className="formulario" action={responder}>
            <input type="hidden" name="codigo" value={codigo} />
            {busca.erro && <p className="mensagem mensagem-erro" role="alert">{busca.erro}</p>}
            <label className="campo"><span className="rotulo">Seu nome</span><input className="entrada" name="nome" required maxLength={120} autoComplete="name" /></label>
            <fieldset className="linha">
              <legend className="rotulo">Você vai?</legend>
              <label><input type="radio" name="vai" value="sim" defaultChecked /> Vou</label>
              <label><input type="radio" name="vai" value="nao" /> Não vou</label>
            </fieldset>
            <label className="campo"><span className="rotulo">Quantas pessoas (contando você)</span><input className="entrada" name="quantidade" type="number" min={1} max={20} defaultValue={1} /></label>
            <label className="campo"><span className="rotulo">Recado (opcional)</span><textarea className="entrada" name="recado" maxLength={500} rows={2} /></label>
            <button className="botao" type="submit">Responder</button>
          </form>
        )}
      </section>
    </>
  );
}
