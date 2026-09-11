'use client';

import { useOptimistic, useState, useTransition, type FormEvent } from 'react';
import { TITULO_MAX, type Tarefa } from '@/lib/superdb/tarefas';
import { adicionar, alternar, apagar } from './acoes';

type Mudanca =
  | { tipo: 'adicionar'; tarefa: Tarefa }
  | { tipo: 'alternar'; id: string; feita: boolean }
  | { tipo: 'apagar'; id: string };

/**
 * A lista vem pronta do servidor. Cada clique muda a tela na hora (useOptimistic)
 * e chama a Server Action; quando ela termina, o servidor manda a lista de novo.
 * Se a ação falhar, a mudança otimista some sozinha e o erro aparece.
 */
export function ListaDeTarefas({ tarefas }: { tarefas: Tarefa[] }) {
  const [titulo, setTitulo] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, iniciar] = useTransition();
  const [visiveis, aplicar] = useOptimistic(tarefas, (atuais: Tarefa[], m: Mudanca) => {
    if (m.tipo === 'adicionar') return [m.tarefa, ...atuais];
    if (m.tipo === 'apagar') return atuais.filter((t) => t.id !== m.id);
    return atuais.map((t) => (t.id === m.id ? { ...t, feita: m.feita } : t));
  });

  function executar(mudanca: Mudanca, acao: () => Promise<{ erro: string | null }>, depois?: () => void) {
    iniciar(async () => {
      aplicar(mudanca);
      const { erro } = await acao();
      setErro(erro);
      if (!erro) depois?.();
    });
  }

  function enviar(e: FormEvent) {
    e.preventDefault();
    const texto = titulo.trim();
    if (!texto) return;
    const provisoria: Tarefa = { id: `nova-${Date.now()}`, titulo: texto, feita: false, criada_em: new Date().toISOString() };
    executar({ tipo: 'adicionar', tarefa: provisoria }, () => adicionar(texto), () => setTitulo(''));
  }

  const feitas = visiveis.filter((t) => t.feita).length;

  return (
    <>
      <form className="nova-tarefa" onSubmit={enviar}>
        <label htmlFor="nova" className="sr-only">
          Nova tarefa
        </label>
        <input
          id="nova"
          className="entrada"
          placeholder="O que precisa ser feito?"
          maxLength={TITULO_MAX}
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
        />
        <button className="botao" type="submit" disabled={enviando || !titulo.trim()}>
          {enviando ? 'Salvando…' : 'Adicionar'}
        </button>
      </form>

      {erro && (
        <p className="mensagem mensagem-erro mensagem-solta" role="alert">
          {erro}
        </p>
      )}

      {visiveis.length === 0 ? (
        <p className="vazio">Nenhuma tarefa ainda. Que tal a primeira?</p>
      ) : (
        <>
          <ul className="lista">
            {visiveis.map((t) => (
              <li key={t.id} className={t.feita ? 'tarefa feita' : 'tarefa'}>
                <input
                  type="checkbox"
                  className="caixa"
                  checked={t.feita}
                  onChange={() => executar({ tipo: 'alternar', id: t.id, feita: !t.feita }, () => alternar(t.id, !t.feita))}
                  aria-label={`Marcar "${t.titulo}" como ${t.feita ? 'pendente' : 'feita'}`}
                />
                <span className="tarefa-titulo">{t.titulo}</span>
                <button
                  className="apagar"
                  onClick={() => executar({ tipo: 'apagar', id: t.id }, () => apagar(t.id))}
                  aria-label={`Apagar "${t.titulo}"`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          <p className="contador">
            {feitas} de {visiveis.length} {visiveis.length === 1 ? 'feita' : 'feitas'}
          </p>
        </>
      )}
    </>
  );
}
