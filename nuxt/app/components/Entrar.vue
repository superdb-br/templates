<script setup lang="ts">
import { mensagemDe } from '~/lib/superdb/erros'

const { app } = useSuperDB()

type Modo = 'entrar' | 'criar'

const modo = ref<Modo>('entrar')
const email = ref('')
const senha = ref('')
const enviando = ref(false)
const erro = ref<string | null>(null)

async function enviar() {
  enviando.value = true
  erro.value = null
  try {
    // Deu certo: o App recebe a sessão pelo aoMudar e troca de tela sozinho.
    if (modo.value === 'entrar') await app.entrar(email.value, senha.value)
    else await app.criarConta(email.value, senha.value)
  } catch (falha) {
    erro.value = mensagemDe(falha)
    enviando.value = false
  }
}

function trocar(novo: Modo) {
  modo.value = novo
  erro.value = null
}
</script>

<template>
  <section class="cartao" aria-labelledby="titulo-entrar">
    <h1 id="titulo-entrar" class="titulo">
      {{ modo === 'entrar' ? 'Entre para ver suas tarefas' : 'Crie sua conta' }}
    </h1>
    <p class="subtitulo">Cada pessoa só enxerga as próprias tarefas.</p>

    <div class="abas" role="tablist" aria-label="Entrar ou criar conta">
      <button type="button" role="tab" class="aba" :aria-selected="modo === 'entrar'" @click="trocar('entrar')">
        Entrar
      </button>
      <button type="button" role="tab" class="aba" :aria-selected="modo === 'criar'" @click="trocar('criar')">
        Criar conta
      </button>
    </div>

    <form class="formulario" @submit.prevent="enviar">
      <label class="campo">
        <span class="rotulo">E-mail</span>
        <input v-model="email" class="entrada" type="email" autocomplete="email" required />
      </label>
      <div class="campo">
        <label class="rotulo" for="senha">Senha</label>
        <input
          id="senha"
          v-model="senha"
          class="entrada"
          type="password"
          :autocomplete="modo === 'entrar' ? 'current-password' : 'new-password'"
          minlength="8"
          required
          :aria-describedby="modo === 'criar' ? 'dica-senha' : undefined"
        />
        <span v-if="modo === 'criar'" id="dica-senha" class="dica">Pelo menos 8 caracteres.</span>
      </div>

      <p v-if="erro" class="mensagem mensagem-erro" role="alert">{{ erro }}</p>

      <button class="botao" type="submit" :disabled="enviando">
        {{ enviando ? 'Um instante…' : modo === 'entrar' ? 'Entrar' : 'Criar conta' }}
      </button>
    </form>
  </section>
</template>
