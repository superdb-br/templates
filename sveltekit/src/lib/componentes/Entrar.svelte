<script lang="ts">
	import { app } from '$lib/superdb';
	import { mensagemDe } from '$lib/superdb/erros';

	type Modo = 'entrar' | 'criar';

	let modo = $state<Modo>('entrar');
	let email = $state('');
	let senha = $state('');
	let enviando = $state(false);
	let erro = $state<string | null>(null);

	async function enviar(e: SubmitEvent) {
		e.preventDefault();
		enviando = true;
		erro = null;
		try {
			// Deu certo: a página recebe a sessão pelo aoMudar e troca de tela sozinha.
			if (modo === 'entrar') await app.entrar(email, senha);
			else await app.criarConta(email, senha);
		} catch (falha) {
			erro = mensagemDe(falha);
			enviando = false;
		}
	}

	function trocar(novo: Modo) {
		modo = novo;
		erro = null;
	}
</script>

<section class="cartao" aria-labelledby="titulo-entrar">
	<h1 id="titulo-entrar" class="titulo">
		{modo === 'entrar' ? 'Entre para ver suas tarefas' : 'Crie sua conta'}
	</h1>
	<p class="subtitulo">Cada pessoa só enxerga as próprias tarefas.</p>

	<div class="abas" role="tablist" aria-label="Entrar ou criar conta">
		<button type="button" role="tab" class="aba" aria-selected={modo === 'entrar'} onclick={() => trocar('entrar')}>
			Entrar
		</button>
		<button type="button" role="tab" class="aba" aria-selected={modo === 'criar'} onclick={() => trocar('criar')}>
			Criar conta
		</button>
	</div>

	<form class="formulario" onsubmit={enviar}>
		<label class="campo">
			<span class="rotulo">E-mail</span>
			<input bind:value={email} class="entrada" type="email" autocomplete="email" required />
		</label>
		<div class="campo">
			<label class="rotulo" for="senha">Senha</label>
			<input
				id="senha"
				bind:value={senha}
				class="entrada"
				type="password"
				autocomplete={modo === 'entrar' ? 'current-password' : 'new-password'}
				minlength="8"
				required
				aria-describedby={modo === 'criar' ? 'dica-senha' : undefined}
			/>
			{#if modo === 'criar'}<span id="dica-senha" class="dica">Pelo menos 8 caracteres.</span>{/if}
		</div>

		{#if erro}<p class="mensagem mensagem-erro" role="alert">{erro}</p>{/if}

		<button class="botao" type="submit" disabled={enviando}>
			{enviando ? 'Um instante…' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}
		</button>
	</form>
</section>
