import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { sessaoAtual } from '@/lib/superdb/servidor';

// A raiz leva ao funil; cada pessoa tem o próprio CRM.
export default async function Inicio() {
  await connection();
  redirect((await sessaoAtual()) ? '/painel' : '/entrar');
}
