<script lang="ts">
	import { onMount } from 'svelte';
	import { NOMES, config } from '$lib/superdb';
	import { diagnosticar, type Passo } from '$lib/superdb/diagnostico';

	const ICONE = { ok: '✓', falta: '✕', aviso: '!' } as const;
	const exemploEnv = `# .env  (depois, reinicie o npm run dev)
${NOMES.url}=https://auth.superdb.com.br
${NOMES.anonKey}=cole-a-chave-anon-aqui
${NOMES.projeto}=slug-do-projeto`;

	let passos = $state<Passo[] | null>(null);
	const faltaAlgo = $derived(passos?.some((p) => p.estado !== 'ok'));

	async function conferir() {
		passos = null;
		passos = await diagnosticar(config, NOMES);
	}

	onMount(conferir);
</script>

<section class="cartao" aria-labelledby="titulo-conexao">
	<h2 id="titulo-conexao" class="titulo-secao">Conexão com o SuperDB</h2>
	{#if !passos}
		<div class="carregando">Conferindo…</div>
	{:else}
		<ul class="passos">
			{#each passos as p (p.id)}
				<li class="passo" data-estado={p.estado}>
					<span class="passo-icone" aria-hidden="true">{ICONE[p.estado]}</span>
					<div>
						<strong>{p.titulo}</strong>
						<p>{p.detalhe}</p>
					</div>
				</li>
			{/each}
		</ul>
		{#if passos[0]?.estado === 'falta'}<pre class="codigo">{exemploEnv}</pre>{/if}
		{#if faltaAlgo}
			<div class="acoes">
				<button class="botao botao-secundario botao-pequeno" onclick={conferir}>Conferir de novo</button>
			</div>
		{/if}
	{/if}
</section>
