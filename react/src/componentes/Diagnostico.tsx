import { useCallback, useEffect, useState } from 'react'
import { NOMES, config } from '../superdb'
import { diagnosticar, type Passo } from '../lib/superdb/diagnostico'

const ICONE = { ok: '✓', falta: '✕', aviso: '!' } as const

/** Confere variáveis, projeto e tabela, e diz o que falta. */
export function Diagnostico() {
  const [passos, setPassos] = useState<Passo[] | null>(null)

  const conferir = useCallback(() => {
    setPassos(null)
    void diagnosticar(config, NOMES).then(setPassos)
  }, [])

  useEffect(conferir, [conferir])

  const faltaAlgo = passos?.some((p) => p.estado !== 'ok')

  return (
    <section className="cartao" aria-labelledby="titulo-conexao">
      <h2 id="titulo-conexao" className="titulo-secao">
        Conexão com o SuperDB
      </h2>
      {!passos ? (
        <div className="carregando">Conferindo…</div>
      ) : (
        <>
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
            <pre className="codigo">{`# .env  (depois, reinicie o npm run dev)
${NOMES.url}=https://auth.superdb.com.br
${NOMES.anonKey}=cole-a-chave-anon-aqui
${NOMES.projeto}=slug-do-projeto`}</pre>
          )}
          {faltaAlgo && (
            <div className="acoes">
              <button className="botao botao-secundario botao-pequeno" onClick={conferir}>
                Conferir de novo
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
