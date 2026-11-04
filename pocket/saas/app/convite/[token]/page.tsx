import { redirect } from 'next/navigation';
import { superdbDoServidor } from '@/lib/superdb/servidor';
import { exigirSessao } from '../../_componentes/sessao';
import { Cabecalho } from '../../_componentes/Cabecalho';
import { Entrar } from '../../_componentes/Entrar';
import { ERROS } from '@/lib/modelo';

async function aceitar(f: FormData) {
  'use server';
  const token = String(f.get('token') ?? '');
  const { superdb } = await exigirSessao();
  const { data, error } = await superdb.rpc('aceitar_convite', { p_token: token });
  if (error) redirect(`/convite/${encodeURIComponent(token)}?erro=${encodeURIComponent(ERROS[error.message ?? ''] ?? 'Não deu para aceitar agora.')}`);
  redirect(`/org/${data as string}`);
}

// Quem recebeu o link entra (ou cria a conta) com o e-mail convidado e aceita.
export default async function PaginaConvite({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ erro?: string }> }) {
  const { token } = await params;
  const { erro } = await searchParams;
  const superdb = await superdbDoServidor();
  const sessao = (await superdb.auth.getSession()).data.session;

  if (!sessao) {
    return (
      <>
        <Cabecalho />
        <Entrar titulo="Entre para aceitar o convite" subtitulo="Use o mesmo e-mail que recebeu o convite. Depois de entrar, abra este link de novo." />
      </>
    );
  }

  return (
    <>
      <Cabecalho email={sessao.user?.email} />
      <section className="cartao">
        <h1 className="titulo">Aceitar o convite</h1>
        {erro && <p className="mensagem mensagem-erro">{erro}</p>}
        <form action={aceitar}>
          <input type="hidden" name="token" value={token} />
          <button className="botao" type="submit">Entrar na organização</button>
        </form>
      </section>
    </>
  );
}
