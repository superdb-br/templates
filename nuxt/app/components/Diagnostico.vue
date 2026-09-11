<script setup lang="ts">
import { diagnosticar, type Passo } from '~/lib/superdb/diagnostico'

const { config } = useSuperDB()

const ICONE = { ok: '✓', falta: '✕', aviso: '!' } as const

const passos = ref<Passo[] | null>(null)
const faltaAlgo = computed(() => passos.value?.some((p) => p.estado !== 'ok'))
const exemploEnv = `# .env  (depois, reinicie o npm run dev)
${NOMES.url}=https://auth.superdb.com.br
${NOMES.anonKey}=cole-a-chave-anon-aqui
${NOMES.projeto}=slug-do-projeto`

async function conferir() {
  passos.value = null
  passos.value = await diagnosticar(config, NOMES)
}

onMounted(conferir)
</script>

<template>
  <section class="cartao" aria-labelledby="titulo-conexao">
    <h2 id="titulo-conexao" class="titulo-secao">Conexão com o SuperDB</h2>
    <div v-if="!passos" class="carregando">Conferindo…</div>
    <template v-else>
      <ul class="passos">
        <li v-for="p in passos" :key="p.id" class="passo" :data-estado="p.estado">
          <span class="passo-icone" aria-hidden="true">{{ ICONE[p.estado] }}</span>
          <div>
            <strong>{{ p.titulo }}</strong>
            <p>{{ p.detalhe }}</p>
          </div>
        </li>
      </ul>
      <pre v-if="passos[0]?.estado === 'falta'" class="codigo">{{ exemploEnv }}</pre>
      <div v-if="faltaAlgo" class="acoes">
        <button class="botao botao-secundario botao-pequeno" @click="conferir">Conferir de novo</button>
      </div>
    </template>
  </section>
</template>
