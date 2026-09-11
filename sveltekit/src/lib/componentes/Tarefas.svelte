<script lang="ts">
	import { onMount } from 'svelte';
	import { app, superdb } from '$lib/superdb';
	import { ErroSuperDB, mensagemDe } from '$lib/superdb/erros';
	import {
		TITULO_MAX,
		alternarTarefa,
		apagarTarefa,
		criarTarefa,
		listarTarefas,
		type Tarefa
	} from '$lib/superdb/tarefas';

	let tarefas = $state<Tarefa[] | null>(null);
	let titulo = $state('');
	let enviando = $state(false);
	let erro = $state<ErroSuperDB | Error | null>(null);

	const feitas = $derived(tarefas?.filter((t) => t.feita).length ?? 0);
	const faltaTabela = $derived(erro instanceof ErroSuperDB && erro.codigo === 'tabela_ausente');

	function falhou(falha: unknown) {
		// Sessão encerrada (em outro lugar, ou expirada): volta para o login.
		if (falha instanceof ErroSuperDB && falha.codigo === 'sessao_expirada') {
			void app.sair();
			return;
		}
		erro = falha instanceof Error ? falha : new Error(mensagemDe(falha));
	}

	async function carregar() {
		try {
			tarefas = await listarTarefas(superdb);
			erro = null;
		} catch (falha) {
			falhou(falha);
		}
	}

	async function adicionar(e: SubmitEvent) {
		e.preventDefault();
		enviando = true;
		try {
			const nova = await criarTarefa(superdb, titulo);
			tarefas = [nova, ...(tarefas ?? [])];
			titulo = '';
			erro = null;
		} catch (falha) {
			falhou(falha);
		} finally {
			enviando = false;
		}
	}

	// Alternar e apagar mudam a tela na hora e desfazem se o servidor recusar.
	async function alternar(tarefa: Tarefa) {
		const antes = tarefa.feita;
		tarefa.feita = !antes;
		try {
			await alternarTarefa(superdb, tarefa.id, !antes);
		} catch (falha) {
			tarefa.feita = antes;
			falhou(falha);
		}
	}

	async function apagar(tarefa: Tarefa) {
		const antes = tarefas;
		tarefas = antes?.filter((t) => t.id !== tarefa.id) ?? null;
		try {
			await apagarTarefa(superdb, tarefa.id);
		} catch (falha) {
			tarefas = antes;
			falhou(falha);
		}
	}

	onMount(carregar);
</script>

{#if faltaTabela}
	<!-- Sem a tabela, a tela vira o passo que falta, e não um erro solto. -->
	<section class="cartao">
		<h1 class="titulo">Falta criar a tabela</h1>
		<p class="subtitulo">O app está ligado ao projeto, mas a tabela <code>tarefas</code> ainda não existe.</p>
		<ol class="lista-numerada">
			<li>Abra o projeto no painel do SuperDB e clique em SQL Editor.</li>
			<li>Cole o conteúdo do arquivo <code>superdb/schema.sql</code> deste template e rode.</li>
			<li>Volte aqui e confira de novo.</li>
		</ol>
		<div class="acoes">
			<a class="botao" href="https://app.superdb.com.br" target="_blank" rel="noreferrer">Abrir o painel</a>
			<button class="botao botao-secundario" onclick={carregar}>Conferir de novo</button>
		</div>
	</section>
{:else}
	<section class="cartao" aria-labelledby="titulo-tarefas">
		<h1 id="titulo-tarefas" class="titulo">Suas tarefas</h1>

		<form class="nova-tarefa" onsubmit={adicionar}>
			<label for="nova" class="sr-only">Nova tarefa</label>
			<input
				id="nova"
				bind:value={titulo}
				class="entrada"
				placeholder="O que precisa ser feito?"
				maxlength={TITULO_MAX}
			/>
			<button class="botao" type="submit" disabled={enviando || !titulo.trim()}>
				{enviando ? 'Salvando…' : 'Adicionar'}
			</button>
		</form>

		{#if erro}<p class="mensagem mensagem-erro mensagem-solta" role="alert">{erro.message}</p>{/if}

		{#if !tarefas}
			<div class="carregando">Carregando tarefas…</div>
		{:else if tarefas.length === 0}
			<p class="vazio">Nenhuma tarefa ainda. Que tal a primeira?</p>
		{:else}
			<ul class="lista">
				{#each tarefas as t (t.id)}
					<li class="tarefa" class:feita={t.feita}>
						<input
							type="checkbox"
							class="caixa"
							checked={t.feita}
							onchange={() => alternar(t)}
							aria-label={`Marcar "${t.titulo}" como ${t.feita ? 'pendente' : 'feita'}`}
						/>
						<span class="tarefa-titulo">{t.titulo}</span>
						<button class="apagar" onclick={() => apagar(t)} aria-label={`Apagar "${t.titulo}"`}>×</button>
					</li>
				{/each}
			</ul>
			<p class="contador">{feitas} de {tarefas.length} {tarefas.length === 1 ? 'feita' : 'feitas'}</p>
		{/if}
	</section>
{/if}
