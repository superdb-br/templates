import { dados } from '../../_componentes/sessao';
import { criarCliente } from '../acoes';
import { Balcao, exigirEquipe } from '../loja';

type Cliente = { id: string; nome: string; documento: string | null; telefone: string | null; email: string | null; endereco: unknown };

export default async function Clientes({ searchParams }: { searchParams: Promise<{ erro?: string; aviso?: string }> }) {
  const { superdb, sessao, membro } = await exigirEquipe();
  const { erro, aviso } = await searchParams;
  if (!membro) return <Balcao sessao={sessao} membro={null}>{null}</Balcao>;
  const clientes = await dados<Cliente[]>(superdb.from('clientes').select('id, nome, documento, telefone, email, endereco').order('nome').limit(500));

  return (
    <Balcao sessao={sessao} membro={membro} erro={erro} aviso={aviso}>
      <section className="cartao">
        <h1 className="titulo">Clientes</h1>
        {clientes.length === 0 ? <p className="vazio">Nenhum cliente ainda.</p> : (
          <table className="tabela">
            <thead><tr><th scope="col">Nome</th><th scope="col">CPF ou CNPJ</th><th scope="col">Telefone</th><th scope="col">Para a nota</th></tr></thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id}>
                  <td>{c.nome}{c.email && <><br /><span className="dica">{c.email}</span></>}</td>
                  <td>{c.documento ?? '·'}</td>
                  <td>{c.telefone ?? '·'}</td>
                  <td>{c.documento && c.endereco ? 'completo' : <span className="etiqueta">falta documento ou endereço</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="cartao">
        <h2 className="titulo-secao">Novo cliente</h2>
        <form className="formulario" action={criarCliente}>
          <input className="entrada" name="nome" placeholder="Nome ou razão social" required maxLength={200} />
          <div className="linha">
            <input className="entrada" name="documento" placeholder="CPF ou CNPJ" inputMode="numeric" maxLength={18} />
            <input className="entrada" name="telefone" placeholder="Telefone" maxLength={30} />
            <input className="entrada" name="email" type="email" placeholder="E-mail" maxLength={200} />
          </div>
          <p className="dica">A NFS-e pede o CPF ou CNPJ e o endereço completo do cliente.</p>
          <div className="linha">
            <input className="entrada" name="logradouro" placeholder="Rua" maxLength={120} />
            <input className="entrada" name="numero" placeholder="Número" maxLength={20} />
            <input className="entrada" name="bairro" placeholder="Bairro" maxLength={80} />
          </div>
          <div className="linha">
            <input className="entrada" name="cep" placeholder="CEP" inputMode="numeric" maxLength={9} />
            <input className="entrada" name="codigo_municipio" placeholder="Código IBGE do município (7 dígitos)" inputMode="numeric" maxLength={7} />
          </div>
          <button className="botao" type="submit">Cadastrar</button>
        </form>
      </section>
    </Balcao>
  );
}
