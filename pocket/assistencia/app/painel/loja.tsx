import 'server-only';
import type { ReactNode } from 'react';
import type { Session, SupabaseClient } from '@superdb/client';
import { exigirSessao, dados } from '../_componentes/sessao';
import { Cabecalho } from '../_componentes/Cabecalho';
import { PAPEIS } from '@/lib/modelo';

export type Membro = { user_id: string; nome: string; papel: 'dono' | 'atendente' | 'tecnico' };

/** A sessão e o lugar na equipe. Fora da equipe, `membro` é null e o RLS não mostra nada. */
export async function exigirEquipe(): Promise<{ superdb: SupabaseClient; sessao: Session; membro: Membro | null }> {
  const { superdb, sessao } = await exigirSessao();
  const membro = await dados<Membro | null>(
    superdb.from('equipe').select('user_id, nome, papel').eq('user_id', sessao.user?.id ?? '').maybeSingle(),
  );
  return { superdb, sessao, membro };
}

const ABAS = [
  { href: '/painel', nome: 'Ordens' },
  { href: '/painel/clientes', nome: 'Clientes' },
  { href: '/painel/estoque', nome: 'Estoque' },
  { href: '/painel/equipe', nome: 'Equipe' },
];

/** O cabeçalho com as abas, ou, para quem ainda não é da equipe, o caminho para entrar nela. */
export function Balcao({ sessao, membro, erro, aviso, children }: { sessao: Session; membro: Membro | null; erro?: string; aviso?: string; children: ReactNode }) {
  return (
    <>
      <Cabecalho email={sessao.user?.email} />
      {!membro ? (
        <section className="cartao">
          <h1 className="titulo">Você ainda não é da equipe</h1>
          <p className="subtitulo">
            Só a equipe da loja vê as ordens. Se você é o dono e acabou de aplicar o modelo, cadastre-se como dono no SQL
            Editor do painel do SuperDB:
          </p>
          <pre className="pix-copia-cola">{`insert into equipe (user_id, nome, papel)\nvalues ('${sessao.user?.id}', 'Seu nome', 'dono');`}</pre>
          <p className="dica">
            Atendente ou técnico: mande este código ao dono da loja, que põe você na equipe pela tela Equipe:{' '}
            <code>{sessao.user?.id}</code>
          </p>
        </section>
      ) : (
        <>
          <nav className="linha" aria-label="Seções do balcão">
            {ABAS.map((a) => (
              <a key={a.href} className="botao botao-secundario botao-pequeno" href={a.href}>
                {a.nome}
              </a>
            ))}
            <span className="dica">
              {membro.nome} · {PAPEIS[membro.papel]}
            </span>
          </nav>
          {erro && <p className="mensagem mensagem-erro mensagem-solta">{erro}</p>}
          {aviso && <p className="mensagem mensagem-aviso mensagem-solta">{aviso}</p>}
          {children}
        </>
      )}
    </>
  );
}
