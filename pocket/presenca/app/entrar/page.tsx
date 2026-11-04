import { Cabecalho } from '../_componentes/Cabecalho';
import { Entrar } from '../_componentes/Entrar';

export default function PaginaEntrar() {
  return (
    <>
      <Cabecalho />
      <Entrar titulo="Entre para ver seus eventos" subtitulo="Cada anfitrião só enxerga os próprios eventos e respostas." />
    </>
  );
}
