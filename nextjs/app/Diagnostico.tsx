import type { Passo } from '@/lib/superdb/diagnostico';
import { NOMES } from '@/lib/superdb/config';

const ICONE = { ok: '✓', falta: '✕', aviso: '!' } as const;

/** Mostra o que o servidor conferiu: variáveis, projeto e tabela. */
export function Diagnostico({ passos }: { passos: Passo[] }) {
  const faltaAlgo = passos.some((p) => p.estado !== 'ok');
  return (
    <section className="cartao" aria-labelledby="titulo-conexao">
      <h2 id="titulo-conexao" className="titulo-secao">
        Conexão com o SuperDB
      </h2>
      <ul className="passos">
        {passos.map((p) => (
          <li key={p.id} className="passo" data-estado={p.estado}>
            <span className="passo-icone" aria-hidden="true">
              {ICONE[p.estado]}
            </span>
            <div>
              <strong>{p.titulo}</strong>
              <p>{p.detalhe}</p>
            </div>
          </li>
        ))}
      </ul>
      {passos[0]?.estado === 'falta' && (
        <pre className="codigo">{`# .env.local  (depois, reinicie o npm run dev)
${NOMES.url}=https://auth.superdb.com.br
${NOMES.anonKey}=cole-a-chave-anon-aqui
${NOMES.projeto}=slug-do-projeto`}</pre>
      )}
      {faltaAlgo && (
        <div className="acoes">
          <a className="botao botao-secundario botao-pequeno" href="/">
            Conferir de novo
          </a>
        </div>
      )}
    </section>
  );
}
