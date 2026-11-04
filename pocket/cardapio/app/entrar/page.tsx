import { Cabecalho } from '../_componentes/Cabecalho';
import { Entrar } from '../_componentes/Entrar';

export default function PaginaEntrar() {
  return (
    <>
      <Cabecalho />
      <Entrar titulo="Entre para cuidar da loja" subtitulo="Cada dono só enxerga a própria loja e os pedidos dela." />
    </>
  );
}
