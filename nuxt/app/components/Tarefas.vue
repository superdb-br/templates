<script setup lang="ts">
import { ErroSuperDB, mensagemDe } from '~/lib/superdb/erros'
import { TITULO_MAX, alternarTarefa, apagarTarefa, criarTarefa, listarTarefas, type Tarefa } from '~/lib/superdb/tarefas'

const { app, superdb } = useSuperDB()

const tarefas = ref<Tarefa[] | null>(null)
const titulo = ref('')
const enviando = ref(false)
const erro = ref<ErroSuperDB | Error | null>(null)

const feitas = computed(() => tarefas.value?.filter((t) => t.feita).length ?? 0)
const faltaTabela = computed(() => erro.value instanceof ErroSuperDB && erro.value.codigo === 'tabela_ausente')

function falhou(falha: unknown) {
  // Sessão encerrada (em outro lugar, ou expirada): volta para o login.
  if (falha instanceof ErroSuperDB && falha.codigo === 'sessao_expirada') {
    void app.sair()
    return
  }
  erro.value = falha instanceof Error ? falha : new Error(mensagemDe(falha))
}

async function carregar() {
  try {
    tarefas.value = await listarTarefas(superdb)
    erro.value = null
  } catch (falha) {
    falhou(falha)
  }
}

async function adicionar() {
  enviando.value = true
  try {
    const nova = await criarTarefa(superdb, titulo.value)
    tarefas.value = [nova, ...(tarefas.value ?? [])]
    titulo.value = ''
    erro.value = null
  } catch (falha) {
    falhou(falha)
  } finally {
    enviando.value = false
  }
}

// Alternar e apagar mudam a tela na hora e desfazem se o servidor recusar.
async function alternar(tarefa: Tarefa) {
  const antes = tarefa.feita
  tarefa.feita = !antes
  try {
    await alternarTarefa(superdb, tarefa.id, !antes)
  } catch (falha) {
    tarefa.feita = antes
    falhou(falha)
  }
}

async function apagar(tarefa: Tarefa) {
  const antes = tarefas.value
  tarefas.value = antes?.filter((t) => t.id !== tarefa.id) ?? null
  try {
    await apagarTarefa(superdb, tarefa.id)
  } catch (falha) {
    tarefas.value = antes
    falhou(falha)
  }
}

onMounted(carregar)
</script>

<template>
  <!-- Sem a tabela, a tela vira o passo que falta, e não um erro solto. -->
  <section v-if="faltaTabela" class="cartao">
    <h1 class="titulo">Falta criar a tabela</h1>
    <p class="subtitulo">O app está ligado ao projeto, mas a tabela <code>tarefas</code> ainda não existe.</p>
    <ol class="lista-numerada">
      <li>Abra o projeto no painel do SuperDB e clique em SQL Editor.</li>
      <li>Cole o conteúdo do arquivo <code>superdb/schema.sql</code> deste template e rode.</li>
      <li>Volte aqui e confira de novo.</li>
    </ol>
    <div class="acoes">
      <a class="botao" href="https://app.superdb.com.br" target="_blank" rel="noreferrer">Abrir o painel</a>
      <button class="botao botao-secundario" @click="carregar">Conferir de novo</button>
    </div>
  </section>

  <section v-else class="cartao" aria-labelledby="titulo-tarefas">
    <h1 id="titulo-tarefas" class="titulo">Suas tarefas</h1>

    <form class="nova-tarefa" @submit.prevent="adicionar">
      <label for="nova" class="sr-only">Nova tarefa</label>
      <input id="nova" v-model="titulo" class="entrada" placeholder="O que precisa ser feito?" :maxlength="TITULO_MAX" />
      <button class="botao" type="submit" :disabled="enviando || !titulo.trim()">
        {{ enviando ? 'Salvando…' : 'Adicionar' }}
      </button>
    </form>

    <p v-if="erro" class="mensagem mensagem-erro mensagem-solta" role="alert">{{ erro.message }}</p>

    <div v-if="!tarefas" class="carregando">Carregando tarefas…</div>
    <p v-else-if="tarefas.length === 0" class="vazio">Nenhuma tarefa ainda. Que tal a primeira?</p>
    <template v-else>
      <ul class="lista">
        <li v-for="t in tarefas" :key="t.id" :class="['tarefa', { feita: t.feita }]">
          <input
            type="checkbox"
            class="caixa"
            :checked="t.feita"
            :aria-label="`Marcar &quot;${t.titulo}&quot; como ${t.feita ? 'pendente' : 'feita'}`"
            @change="alternar(t)"
          />
          <span class="tarefa-titulo">{{ t.titulo }}</span>
          <button class="apagar" :aria-label="`Apagar &quot;${t.titulo}&quot;`" @click="apagar(t)">×</button>
        </li>
      </ul>
      <p class="contador">{{ feitas }} de {{ tarefas.length }} {{ tarefas.length === 1 ? 'feita' : 'feitas' }}</p>
    </template>
  </section>
</template>
