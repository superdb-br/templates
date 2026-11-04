// Roda antes de cada página e de cada Server Action (é o antigo middleware.ts,
// renomeado no Next 16). Aqui ele só faz uma coisa: renova a sessão do SuperDB
// quando ela está perto de vencer. Quem PROTEGE as páginas e as ações são elas
// mesmas, conferindo a sessão (ver app/tarefas).

import type { NextRequest } from 'next/server';
import { renovarSessao } from './lib/superdb/renovar';

export function proxy(request: NextRequest) {
  return renovarSessao(request);
}

export const config = {
  // Tudo, menos arquivos estáticos: imagem e CSS não precisam de sessão.
  matcher: ['/((?!_next/static|_next/image|favicon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|txt)$).*)'],
};
