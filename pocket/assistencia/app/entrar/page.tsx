import { Cabecalho } from '../_componentes/Cabecalho';
import { Entrar } from '../_componentes/Entrar';

export default function PaginaEntrar() {
  return (
    <>
      <Cabecalho />
      <Entrar
        titulo="Entre no balcão"
        subtitulo="Só a equipe da loja usa este app. O primeiro dono é cadastrado pelo dono do projeto; os outros, pelo dono, na tela Equipe."
      />
    </>
  );
}
