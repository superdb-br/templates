import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Cabecalho } from '../../_componentes/Cabecalho';
import { exigirSessao, dados } from '../../_componentes/sessao';
import { mensagemDe } from '@/lib/superdb/erros';
import { contextoDoPainel } from '../painel';

type Perfil = { id: string; email: string; papel: string; user_id: string | null; convite_token: string | null };

async function convidar(f: FormData) {
  'use server';
  const { superdb } = await exigirSessao();
  let erro = '';
  try {
    await dados(superdb.from('perfis_admin').insert({ email: String(f.get('email') ?? '').trim().toLowerCase(), papel: String(f.get('papel')) }));
  } catch (falha) {
    erro = mensagemDe(falha);
  }
  revalidatePath('/painel/equipe');
  redirect(erro ? `/painel/equipe?erro=${encodeURIComponent(erro)}` : '/painel/equipe');
}

async function remover(f: FormData) {
  'use server';
  const { superdb } = await exigirSessao();
  await superdb.from('perfis_admin').delete().eq('id', String(f.get('id')));
  revalidatePath('/painel/equipe');
  redirect('/painel/equipe');
}

// Só admin: convida pelo e-mail. O convite é um link com token, que só vale para quem
// entrar com o e-mail convidado; mande o link à pessoa.
export default async function Equipe({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { superdb, sessao, papel } = await contextoDoPainel();
  if (papel !== 'admin') notFound();
  const { erro } = await searchParams;
  const perfis = await dados<Perfil[]>(superdb.from('perfis_admin').select('id, email, papel, user_id, convite_token').order('criado_em'));

  return (
    <>
      <Cabecalho email={sessao.user?.email} />
      <section className="cartao">
        <p className="dica"><a href="/painel">Tabelas</a> / equipe</p>
        <h1 className="titulo">Equipe do painel</h1>
        {erro && <p className="mensagem mensagem-erro">{erro}</p>}
        <table className="tabela">
          <thead><tr><th>E-mail</th><th>Papel</th><th>Situação</th><th></th></tr></thead>
          <tbody>
            {perfis.map((p) => (
              <tr key={p.id}>
                <td>{p.email}</td><td>{p.papel}</td><td>{p.user_id ? 'ativo' : p.convite_token ? <>convite: <code>/painel/convite/{p.convite_token}</code></> : 'convite pendente'}</td>
                <td>{p.email !== sessao.user?.email && <form action={remover}><input type="hidden" name="id" value={p.id} /><button className="apagar" aria-label={`Remover ${p.email}`}>×</button></form>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <form className="linha" action={convidar}>
          <input className="entrada" name="email" type="email" placeholder="email@empresa.com" required />
          <select className="entrada" name="papel" defaultValue="leitor"><option value="leitor">leitor</option><option value="admin">admin</option></select>
          <button className="botao botao-pequeno" type="submit">Convidar</button>
        </form>
      </section>
    </>
  );
}
