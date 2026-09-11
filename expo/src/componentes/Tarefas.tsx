import { useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { app, superdb } from '../superdb';
import { ErroSuperDB, mensagemDe } from '../lib/superdb/erros';
import { TITULO_MAX, alternarTarefa, apagarTarefa, criarTarefa, listarTarefas, type Tarefa } from '../lib/superdb/tarefas';
import { useTema } from '../tema';
import { Botao, Carregando, Cartao, Mensagem, Suave, Titulo } from './ui';

export function Tarefas() {
  const t = useTema();
  const [tarefas, setTarefas] = useState<Tarefa[] | null>(null);
  const [titulo, setTitulo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<ErroSuperDB | Error | null>(null);

  const falhou = useCallback((falha: unknown) => {
    // Sessão encerrada (em outro lugar, ou expirada): volta para o login.
    if (falha instanceof ErroSuperDB && falha.codigo === 'sessao_expirada') {
      void app.sair();
      return;
    }
    setErro(falha instanceof Error ? falha : new Error(mensagemDe(falha)));
  }, []);

  const carregar = useCallback(async () => {
    try {
      setTarefas(await listarTarefas(superdb));
      setErro(null);
    } catch (falha) {
      falhou(falha);
    }
  }, [falhou]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function adicionar() {
    setEnviando(true);
    try {
      const nova = await criarTarefa(superdb, titulo);
      setTarefas((atuais) => [nova, ...(atuais ?? [])]);
      setTitulo('');
      setErro(null);
    } catch (falha) {
      falhou(falha);
    } finally {
      setEnviando(false);
    }
  }

  // Alternar e apagar mudam a tela na hora e desfazem se o servidor recusar.
  async function alternar(tarefa: Tarefa) {
    const trocar = (feita: boolean) =>
      setTarefas((atuais) => atuais?.map((x) => (x.id === tarefa.id ? { ...x, feita } : x)) ?? null);
    trocar(!tarefa.feita);
    try {
      await alternarTarefa(superdb, tarefa.id, !tarefa.feita);
    } catch (falha) {
      trocar(tarefa.feita);
      falhou(falha);
    }
  }

  async function apagar(tarefa: Tarefa) {
    const antes = tarefas;
    setTarefas((atuais) => atuais?.filter((x) => x.id !== tarefa.id) ?? null);
    try {
      await apagarTarefa(superdb, tarefa.id);
    } catch (falha) {
      setTarefas(antes);
      falhou(falha);
    }
  }

  // Sem a tabela, a tela vira o passo que falta, e não um erro solto.
  if (erro instanceof ErroSuperDB && erro.codigo === 'tabela_ausente') {
    return (
      <Cartao>
        <Titulo>Falta criar a tabela</Titulo>
        <Suave>O app está ligado ao projeto, mas a tabela "tarefas" ainda não existe.</Suave>
        <Suave>1. Abra o projeto no painel do SuperDB e clique em SQL Editor.</Suave>
        <Suave>2. Cole o conteúdo do arquivo superdb/schema.sql deste template e rode.</Suave>
        <Suave>3. Volte aqui e confira de novo.</Suave>
        <Botao titulo="Abrir o painel" aoTocar={() => void Linking.openURL('https://app.superdb.com.br')} />
        <Botao titulo="Conferir de novo" aoTocar={() => void carregar()} secundario />
      </Cartao>
    );
  }

  const feitas = tarefas?.filter((x) => x.feita).length ?? 0;

  return (
    <Cartao>
      <Titulo>Suas tarefas</Titulo>

      <View style={estilos.nova}>
        <TextInput
          accessibilityLabel="Nova tarefa"
          placeholder="O que precisa ser feito?"
          placeholderTextColor={t.suave}
          maxLength={TITULO_MAX}
          value={titulo}
          onChangeText={setTitulo}
          onSubmitEditing={() => titulo.trim() && void adicionar()}
          returnKeyType="done"
          style={[estilos.entrada, { borderColor: t.bordaForte, color: t.texto, backgroundColor: t.superficie }]}
        />
        <Botao titulo={enviando ? 'Salvando…' : 'Adicionar'} aoTocar={adicionar} desabilitado={enviando || !titulo.trim()} />
      </View>

      {erro ? <Mensagem texto={erro.message} /> : null}

      {!tarefas ? (
        <Carregando texto="Carregando tarefas…" />
      ) : tarefas.length === 0 ? (
        <View style={[estilos.vazio, { borderColor: t.bordaForte }]}>
          <Suave>Nenhuma tarefa ainda. Que tal a primeira?</Suave>
        </View>
      ) : (
        <View>
          {tarefas.map((x, i) => (
            <View key={x.id} style={[estilos.tarefa, i > 0 && { borderTopWidth: 1, borderTopColor: t.borda }]}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: x.feita }}
                accessibilityLabel={`Marcar "${x.titulo}" como ${x.feita ? 'pendente' : 'feita'}`}
                onPress={() => void alternar(x)}
                hitSlop={8}
                style={[
                  estilos.caixa,
                  { borderColor: x.feita ? t.primaria : t.bordaForte, backgroundColor: x.feita ? t.primaria : t.superficie },
                ]}
              >
                {x.feita ? <Text style={{ color: t.sobrePrimaria, fontWeight: '800', fontSize: 12 }}>✓</Text> : null}
              </Pressable>
              <Text
                style={[
                  estilos.titulo,
                  { color: x.feita ? t.suave : t.texto, textDecorationLine: x.feita ? 'line-through' : 'none' },
                ]}
              >
                {x.titulo}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Apagar "${x.titulo}"`}
                onPress={() => void apagar(x)}
                hitSlop={8}
                style={estilos.apagar}
              >
                <Text style={{ color: t.suave, fontSize: 20, lineHeight: 22 }}>×</Text>
              </Pressable>
            </View>
          ))}
          <Text style={{ color: t.suave, fontSize: 13, marginTop: 10 }}>
            {feitas} de {tarefas.length} {tarefas.length === 1 ? 'feita' : 'feitas'}
          </Text>
        </View>
      )}
    </Cartao>
  );
}

const estilos = StyleSheet.create({
  nova: { gap: 8 },
  entrada: { height: 44, borderWidth: 1, borderRadius: 9, paddingHorizontal: 12, fontSize: 15 },
  vazio: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 9, padding: 22, alignItems: 'center' },
  tarefa: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  caixa: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  titulo: { flex: 1, fontSize: 15 },
  apagar: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
});
