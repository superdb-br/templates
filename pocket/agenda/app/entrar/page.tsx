import { Cabecalho } from '../_componentes/Cabecalho';
import { Entrar } from '../_componentes/Entrar';

export default function PaginaEntrar() {
  return (
    <>
      <Cabecalho />
      <Entrar titulo="Entre para ver a agenda" subtitulo="Cada dono só enxerga o próprio salão." />
    </>
  );
}
