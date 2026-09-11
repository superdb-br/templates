<script lang="ts">
	import { dev } from '$app/environment';
	import { app, configurado } from '$lib/superdb';
	import { usuarioDa } from '$lib/superdb/sessao';
	import { sessaoAtual } from '$lib/sessao.svelte';
	import Diagnostico from '$lib/componentes/Diagnostico.svelte';
	import Entrar from '$lib/componentes/Entrar.svelte';
	import Tarefas from '$lib/componentes/Tarefas.svelte';

	const usuario = $derived(usuarioDa(sessaoAtual.sessao));
</script>

<div class="pagina">
	<main class="coluna">
		<header class="cabecalho">
			<div class="marca">
				<img src="/favicon.svg" alt="" />
				Tarefas
			</div>
			{#if usuario}
				<div class="quem">
					<span>{usuario.email}</span>
					<button class="botao botao-secundario botao-pequeno" onclick={() => app.sair()}>Sair</button>
				</div>
			{/if}
		</header>

		{#if !configurado}
			<Diagnostico />
		{:else if sessaoAtual.carregando}
			<div class="cartao carregando">Carregando…</div>
		{:else if sessaoAtual.sessao}
			<Tarefas />
		{:else}
			<Entrar />
			<!-- Confere a ligação com o projeto, só em desenvolvimento (npm run dev). -->
			{#if dev}<Diagnostico />{/if}
		{/if}

		<footer class="rodape">
			Template SvelteKit do SuperDB ·
			<a href="https://github.com/superdb-br/templates" target="_blank" rel="noreferrer">código</a> ·
			<a href="https://superdb.com.br/docs" target="_blank" rel="noreferrer">documentação</a>
		</footer>
	</main>
</div>
