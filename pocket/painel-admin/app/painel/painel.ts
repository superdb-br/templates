import 'server-only';
import { exigirSessao, dados } from '../_componentes/sessao';
import type { Papel } from '@/lib/modelo';

/**
 * Sessão + papel no painel + tabelas visíveis. O papel sai de
 * papel_no_painel(); o perfil é assumido antes, pelo link do convite.
 */
export async function contextoDoPainel() {
  const { superdb, sessao } = await exigirSessao();
  const papel = await dados<Papel>(superdb.rpc('papel_no_painel'));
  const tabelas = papel ? await dados<string[]>(superdb.rpc('tabelas_do_painel')) : [];
  return { superdb, sessao, papel, tabelas };
}
