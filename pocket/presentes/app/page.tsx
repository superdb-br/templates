import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { sessaoAtual } from '@/lib/superdb/servidor';

// A raiz leva o dono ao painel; o convidado entra pelo link /l/<código>.
export default async function Inicio() {
  await connection();
  redirect((await sessaoAtual()) ? '/painel' : '/entrar');
}
