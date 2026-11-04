import { Cabecalho } from '../_componentes/Cabecalho';
import { Entrar } from '../_componentes/Entrar';

export default function PaginaEntrar() {
  return (
    <>
      <Cabecalho />
      <Entrar titulo="Entre na sua conta" subtitulo="Cada pessoa só vê as organizações de que é membro." />
    </>
  );
}
