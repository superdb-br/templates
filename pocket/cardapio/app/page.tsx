import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { sessaoAtual } from '@/lib/superdb/servidor';

// A raiz leva o dono ao painel; o cliente entra pelo link /c/<código>.
export default async function Inicio() {
  await connection();
  redirect((await sessaoAtual()) ? '/painel' : '/entrar');
}
