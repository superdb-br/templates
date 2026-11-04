import { Cabecalho } from '../_componentes/Cabecalho';
import { Entrar } from '../_componentes/Entrar';

export default function PaginaEntrar() {
  return (
    <>
      <Cabecalho />
      <Entrar titulo="Entre no painel" subtitulo="Só entra quem tem perfil: o primeiro admin é cadastrado pelo dono do projeto, e os outros chegam por convite." />
    </>
  );
}
