import { dados } from '../../_componentes/sessao';
import { PAPEIS } from '@/lib/modelo';
import { porNaEquipe, tirarDaEquipe } from '../acoes';
import { Balcao, exigirEquipe, type Membro } from '../loja';

export default async function Equipe({ searchParams }: { searchParams: Promise<{ erro?: string; aviso?: string }> }) {
  const { superdb, sessao, membro } = await exigirEquipe();
  const { erro, aviso } = await searchParams;
  if (!membro) return <Balcao sessao={sessao} membro={null}>{null}</Balcao>;
  const dono = membro.papel === 'dono';
  // O RLS decide: o dono vê todos; os outros, só a própria linha.
  const equipe = await dados<Membro[]>(superdb.from('equipe').select('user_id, nome, papel').order('nome'));

  return (
    <Balcao sessao={sessao} membro={membro} erro={erro} aviso={aviso}>
      <section className="cartao">
        <h1 className="titulo">Equipe</h1>
        <ul className="lista">
          {equipe.map((m) => (
            <li key={m.user_id} className="linha">
              <span style={{ flex: 1 }}>{m.nome} <span className="etiqueta">{PAPEIS[m.papel]}</span></span>
              {dono && m.user_id !== membro.user_id && (
                <form action={tirarDaEquipe}>
                  <input type="hidden" name="user_id" value={m.user_id} />
                  <button className="botao botao-secundario botao-pequeno" aria-label={`Tirar ${m.nome} da equipe`}>Tirar</button>
                </form>
              )}
            </li>
          ))}
        </ul>
      </section>

      {dono ? (
        <section className="cartao">
          <h2 className="titulo-secao">Pôr alguém na equipe</h2>
          <p className="dica">A pessoa cria a conta neste app e vê o código dela na primeira tela. Cole aqui.</p>
          <form className="formulario" action={porNaEquipe}>
            <input className="entrada" name="user_id" placeholder="Código da pessoa" required pattern="[0-9a-fA-F-]{36}" />
            <div className="linha">
              <input className="entrada" name="nome" placeholder="Nome" required maxLength={120} />
              <select className="entrada" name="papel" aria-label="Papel">
                <option value="atendente">Atendente</option>
                <option value="tecnico">Técnico</option>
                <option value="dono">Dono</option>
              </select>
            </div>
            <button className="botao" type="submit">Pôr na equipe</button>
          </form>
        </section>
      ) : (
        <p className="dica">Só o dono põe e tira gente da equipe.</p>
      )}
    </Balcao>
  );
}
