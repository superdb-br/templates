import { notFound, redirect } from 'next/navigation';
import { superdbDoServidor } from '@/lib/superdb/servidor';
import { reais } from '@/lib/pix/brcode';
import { Cabecalho } from '../../_componentes/Cabecalho';
import { ERROS } from '@/lib/modelo';

export type ListaPublica = {
  lista: { titulo: string; mensagem: string | null };
  pix: { chave: string | null; nome: string | null; cidade: string | null };
  itens: { id: string; nome: string; descricao: string | null; valor_centavos: number; disponivel: boolean }[];
};

async function escolher(f: FormData) {
  'use server';
  const v = (k: string) => String(f.get(k) ?? '').trim();
  const codigo = v('codigo');
  const superdb = await superdbDoServidor();
  const { error } = await superdb.rpc('declarar_presente', { p_codigo: codigo, p_item: v('item'), p_nome: v('nome'), p_recado: v('recado') });
  if (error) redirect(`/l/${encodeURIComponent(codigo)}?erro=${encodeURIComponent(ERROS[error.message ?? ''] ?? 'Não deu para escolher agora.')}`);
  // O Pix sai na página seguinte, com o valor do presente lido do banco.
  redirect(`/l/${encodeURIComponent(codigo)}/pagar/${encodeURIComponent(v('item'))}`);
}

// A lista pública: sem login, com a chave anon e o código da lista.
export default async function PaginaLista({ params, searchParams }: { params: Promise<{ codigo: string }>; searchParams: Promise<{ erro?: string }> }) {
  const { codigo } = await params;
  const { erro } = await searchParams;
  const superdb = await superdbDoServidor();
  const { data } = await superdb.rpc('lista_publica', { p_codigo: codigo });
  const lista = data as ListaPublica | null;
  if (!lista) notFound();

  return (
    <div className="publico">
      <Cabecalho titulo={lista.lista.titulo} />
      <section className="cartao">
        <h1 className="titulo">{lista.lista.titulo}</h1>
        {lista.lista.mensagem && <p className="subtitulo">{lista.lista.mensagem}</p>}
        {erro && <p className="mensagem mensagem-erro" role="alert">{erro}</p>}
        <div className="grade">
          {lista.itens.map((i) => (
            <form key={i.id} className="presente" action={escolher} data-escolhido={i.disponivel ? undefined : ''}>
              <input type="hidden" name="codigo" value={codigo} />
              <input type="hidden" name="item" value={i.id} />
              <strong>{i.nome}</strong>
              {i.descricao && <span className="dica">{i.descricao}</span>}
              <span className="numero-grande">{reais(i.valor_centavos)}</span>
              {i.disponivel ? (
                <>
                  <input className="entrada" name="nome" placeholder="Seu nome" required maxLength={120} aria-label={`Seu nome para ${i.nome}`} />
                  <input className="entrada" name="recado" placeholder="Recado (opcional)" maxLength={500} aria-label="Recado" />
                  <button className="botao botao-pequeno" type="submit">Dar este presente</button>
                </>
              ) : (
                <span className="etiqueta" data-tom="neutro">Já escolhido</span>
              )}
            </form>
          ))}
        </div>
      </section>
    </div>
  );
}
