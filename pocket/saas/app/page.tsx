import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { sessaoAtual } from '@/lib/superdb/servidor';

// A raiz leva às organizações; quem foi convidado entra pelo link /convite/<token>.
export default async function Inicio() {
  await connection();
  redirect((await sessaoAtual()) ? '/painel' : '/entrar');
}
