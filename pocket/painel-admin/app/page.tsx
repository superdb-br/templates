import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { sessaoAtual } from '@/lib/superdb/servidor';

// A raiz leva ao painel; só quem tem perfil vê os dados.
export default async function Inicio() {
  await connection();
  redirect((await sessaoAtual()) ? '/painel' : '/entrar');
}
