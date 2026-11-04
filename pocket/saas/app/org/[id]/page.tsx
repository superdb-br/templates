import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { exigirSessao, dados } from '../../_componentes/sessao';
import { Cabecalho } from '../../_componentes/Cabecalho';
import { mensagemDe } from '@/lib/superdb/erros';
import { ESTADOS } from '@/lib/modelo';

type Org = { id: string; nome: string };
type Membro = { user_id: string; email: string; papel: string };
type Convite = { id: string; email: string; papel: string; token: string; expira_em: string; aceito_em: string | null };
type Assinatura = { plano: string; estado: string; vence_em: string | null };

async function agir(id: string, acao: (s: Awaited<ReturnType<typeof exigirSessao>>['superdb']) => Promise<unknown>) {
  const { superdb } = await exigirSessao();
  let erro = '';
  try {
    await acao(superdb);
  } catch (falha) {
    erro = mensagemDe(falha);
  }
  revalidatePath(`/org/${id}`);
  redirect(erro ? `/org/${id}?erro=${encodeURIComponent(erro)}` : `/org/${id}`);
}

async function convidar(f: FormData) {
  'use server';
  const id = String(f.get('org'));
  await agir(id, (s) => dados(s.from('convites').insert({ organizacao_id: id, email: String(f.get('email')).trim().toLowerCase(), papel: String(f.get('papel')) })));
}

async function mudarPapel(f: FormData) {
  'use server';
  const id = String(f.get('org'));
  await agir(id, (s) => dados(s.from('membros').update({ papel: String(f.get('papel')) }).eq('organizacao_id', id).eq('user_id', String(f.get('user')))));
}

async function remover(f: FormData) {
  'use server';
  const id = String(f.get('org'));
  await agir(id, (s) => dados(s.from('membros').delete().eq('organizacao_id', id).eq('user_id', String(f.get('user')))));
}

export default async function PaginaOrg({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ erro?: string }> }) {
  const { id } = await params;
  const { erro } = await searchParams;
  const { superdb, sessao } = await exigirSessao();
  const [org] = await dados<Org[]>(superdb.from('organizacoes').select('id, nome').eq('id', id));
  if (!org) notFound();
  const [membros, assinaturas] = await Promise.all([
    dados<Membro[]>(superdb.from('membros').select('user_id, email, papel').eq('organizacao_id', id).order('criado_em')),
    dados<Assinatura[]>(superdb.from('assinaturas').select('plano, estado, vence_em').eq('organizacao_id', id)),
  ]);
  const meuPapel = membros.find((m) => m.user_id === sessao.user.id)?.papel;
  const gerencia = meuPapel === 'dono' || meuPapel === 'admin';
  const convites = gerencia ? await dados<Convite[]>(superdb.from('convites').select('id, email, papel, token, expira_em, aceito_em').eq('organizacao_id', id).is('aceito_em', null)) : [];
  const assinatura = assinaturas[0];

  return (
    <>
      <Cabecalho email={sessao.user?.email} titulo={org.nome} />
      {erro && <p className="mensagem mensagem-erro mensagem-solta">{erro}</p>}
      <section className="cartao">
        <p className="dica"><a href="/painel">Organizações</a> / {org.nome}</p>
        <h1 className="titulo">{org.nome}</h1>
        {assinatura && (
          <p className="subtitulo">
            Plano <strong>{assinatura.plano}</strong>, {ESTADOS[assinatura.estado] ?? assinatura.estado}
            {assinatura.vence_em ? `, vence em ${new Date(assinatura.vence_em).toLocaleDateString('pt-BR')}` : ''}.
          </p>
        )}
        <h2 className="titulo-secao">Membros</h2>
        <table className="tabela">
          <tbody>
            {membros.map((m) => (
              <tr key={m.user_id}>
                <td>{m.email}</td>
                <td>
                  {gerencia && m.papel !== 'dono' ? (
                    <form className="linha" action={mudarPapel}>
                      <input type="hidden" name="org" value={id} /><input type="hidden" name="user" value={m.user_id} />
                      <select className="entrada" name="papel" defaultValue={m.papel}><option value="membro">membro</option><option value="admin">admin</option></select>
                      <button className="botao botao-secundario botao-pequeno">Salvar</button>
                    </form>
                  ) : <span className="etiqueta">{m.papel}</span>}
                </td>
                <td>{m.papel !== 'dono' && (gerencia || m.user_id === sessao.user.id) && (
                  <form action={remover}><input type="hidden" name="org" value={id} /><input type="hidden" name="user" value={m.user_id} /><button className="botao botao-secundario botao-pequeno">{m.user_id === sessao.user.id ? 'Sair' : 'Remover'}</button></form>
                )}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {gerencia && (
        <section className="cartao">
          <h2 className="titulo-secao">Convites</h2>
          <ul className="lista">
            {convites.map((c) => (
              <li key={c.id}>{c.email} ({c.papel}): mande o link <code>/convite/{c.token}</code></li>
            ))}
          </ul>
          <form className="linha" action={convidar}>
            <input type="hidden" name="org" value={id} />
            <input className="entrada" name="email" type="email" placeholder="email@empresa.com" required />
            <select className="entrada" name="papel" defaultValue="membro"><option value="membro">membro</option><option value="admin">admin</option></select>
            <button className="botao botao-pequeno" type="submit">Convidar</button>
          </form>
          <p className="dica">O convite vale 7 dias e só para quem entrar com aquele e-mail. Para enviar por e-mail sozinho, ligue um serviço de e-mail ao seu servidor.</p>
        </section>
      )}
    </>
  );
}
