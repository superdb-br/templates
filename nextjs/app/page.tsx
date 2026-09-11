import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { NOMES, config, configurado } from '@/lib/superdb/config';
import { diagnosticar } from '@/lib/superdb/diagnostico';
import { sessaoAtual } from '@/lib/superdb/servidor';
import { Cabecalho } from './Cabecalho';
import { Diagnostico } from './Diagnostico';
import { FormularioEntrar } from './FormularioEntrar';

export default async function Inicio() {
  // Sempre na hora: o diagnóstico precisa refletir o projeto de agora (ex.: logo
  // depois de você rodar o schema.sql), e não o do momento do build.
  await connection();
  if (configurado && (await sessaoAtual())) redirect('/tarefas');

  // Confere a ligação com o projeto, no servidor. Aparece em desenvolvimento
  // (npm run dev) e sempre que falta configurar algo.
  const mostrarDiagnostico = !configurado || process.env.NODE_ENV !== 'production';
  const passos = mostrarDiagnostico ? await diagnosticar(config, NOMES) : null;

  return (
    <>
      <Cabecalho />
      {configurado && <FormularioEntrar />}
      {passos && <Diagnostico passos={passos} />}
    </>
  );
}
