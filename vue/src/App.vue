<script setup lang="ts">
import { computed } from 'vue'
import { app, configurado } from './superdb'
import { usuarioDa } from './lib/superdb/sessao'
import { usarSessao } from './usarSessao'
import Diagnostico from './componentes/Diagnostico.vue'
import Entrar from './componentes/Entrar.vue'
import Tarefas from './componentes/Tarefas.vue'

const { sessao, carregando } = usarSessao()
const emDesenvolvimento = import.meta.env.DEV
const usuario = computed(() => usuarioDa(sessao.value))
</script>

<template>
  <div class="pagina">
    <main class="coluna">
      <header class="cabecalho">
        <div class="marca">
          <img src="/favicon.svg" alt="" />
          Tarefas
        </div>
        <div v-if="usuario" class="quem">
          <span>{{ usuario.email }}</span>
          <button class="botao botao-secundario botao-pequeno" @click="app.sair()">Sair</button>
        </div>
      </header>

      <Diagnostico v-if="!configurado" />
      <div v-else-if="carregando" class="cartao carregando">Carregando…</div>
      <Tarefas v-else-if="sessao" />
      <template v-else>
        <Entrar />
        <!-- Confere a ligação com o projeto, só em desenvolvimento (npm run dev). -->
        <Diagnostico v-if="emDesenvolvimento" />
      </template>

      <footer class="rodape">
        Template Vue do SuperDB ·
        <a href="https://github.com/superdb-br/templates" target="_blank" rel="noreferrer">código</a> ·
        <a href="https://superdb.com.br/docs" target="_blank" rel="noreferrer">documentação</a>
      </footer>
    </main>
  </div>
</template>
