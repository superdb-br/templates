import { redirect } from 'next/navigation';
import { Cabecalho } from '../../../_componentes/Cabecalho';
import { exigirSessao } from '../../../_componentes/sessao';

async function aceitar(f: FormData) {
  'use server';
  const token = String(f.get('token') ?? '');
  const { superdb } = await exigirSessao();
  const { data } = await superdb.rpc('aceitar_convite_do_painel', { p_token: token });
  redirect(data ? '/painel' : `/painel/convite/${encodeURIComponent(token)}?erro=1`);
}

// O link do convite. Vale só para quem entra com o e-mail convidado, uma vez.
export default async function PaginaDoConvite({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  const { token } = await params;
  const { erro } = await searchParams;
  const { sessao } = await exigirSessao();
  return (
    <>
      <Cabecalho email={sessao.user?.email} />
      <section className="cartao">
        <h1 className="titulo">Entrar na equipe do painel</h1>
        <p className="subtitulo">Você está com a conta {sessao.user?.email}. O convite só vale para o e-mail convidado.</p>
        {erro && <p className="mensagem mensagem-erro">Este convite não vale para esta conta, ou já foi usado. Peça outro a um admin.</p>}
        <form action={aceitar}>
          <input type="hidden" name="token" value={token} />
          <button className="botao" type="submit">Aceitar o convite</button>
        </form>
      </section>
    </>
  );
}
