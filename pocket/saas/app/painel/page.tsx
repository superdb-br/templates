import { redirect } from 'next/navigation';
import { exigirSessao, dados } from '../_componentes/sessao';
import { Cabecalho } from '../_componentes/Cabecalho';
import { ERROS } from '@/lib/modelo';

type Vinculo = { papel: string; organizacoes: { id: string; nome: string } | null };

async function criar(f: FormData) {
  'use server';
  const { superdb } = await exigirSessao();
  const { data, error } = await superdb.rpc('criar_organizacao', { p_nome: String(f.get('nome') ?? '') });
  if (error) redirect(`/painel?erro=${encodeURIComponent(ERROS[error.message ?? ''] ?? error.message ?? 'Não deu para criar.')}`);
  redirect(`/org/${data as string}`);
}

// As organizações de quem entrou. O RLS só devolve aquelas de que a pessoa é membro.
export default async function Painel({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { superdb, sessao } = await exigirSessao();
  const { erro } = await searchParams;
  const vinculos = await dados<Vinculo[]>(superdb.from('membros').select('papel, organizacoes(id, nome)').eq('user_id', sessao.user.id));

  return (
    <>
      <Cabecalho email={sessao.user?.email} />
      <section className="cartao">
        <h1 className="titulo">Suas organizações</h1>
        {erro && <p className="mensagem mensagem-erro">{erro}</p>}
        {vinculos.length === 0 ? <p className="vazio">Você ainda não faz parte de nenhuma.</p> : (
          <ul className="lista">
            {vinculos.filter((v) => v.organizacoes).map((v) => (
              <li key={v.organizacoes!.id}><a href={`/org/${v.organizacoes!.id}`}>{v.organizacoes!.nome}</a> <span className="etiqueta">{v.papel}</span></li>
            ))}
          </ul>
        )}
        <form className="linha" action={criar}>
          <input className="entrada" name="nome" placeholder="Nome da organização" required maxLength={120} />
          <button className="botao botao-pequeno" type="submit">Criar organização</button>
        </form>
      </section>
    </>
  );
}
