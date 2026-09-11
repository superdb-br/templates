// A sessão como estado reativo do Svelte: muda sozinha no login, na saída, na
// renovação e quando outra aba entra ou sai.

import type { Session } from '@superdb/client';
import { app, configurado } from './superdb';

export const sessaoAtual = $state({
	sessao: null as Session | null,
	carregando: configurado
});

if (configurado) {
	app
		.sessao()
		.then((s) => (sessaoAtual.sessao = s))
		.catch(() => undefined)
		.finally(() => (sessaoAtual.carregando = false));
	app.aoMudar((s) => (sessaoAtual.sessao = s));
}
