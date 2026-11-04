import { Cabecalho } from '../_componentes/Cabecalho';
import { Entrar } from '../_componentes/Entrar';

export default function PaginaEntrar() {
  return (
    <>
      <Cabecalho />
      <Entrar titulo="Entre para cuidar da sua lista" subtitulo="Só você vê quem deu cada presente." />
    </>
  );
}
