import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import type { Session } from '@superdb/client';
import { app, configurado } from './superdb';
import { usuarioDa } from './lib/superdb/sessao';
import { useTema } from './tema';
import { Cartao, Carregando } from './componentes/ui';
import { Diagnostico } from './componentes/Diagnostico';
import { Entrar } from './componentes/Entrar';
import { Tarefas } from './componentes/Tarefas';

export default function App() {
  return (
    <SafeAreaProvider>
      <Conteudo />
    </SafeAreaProvider>
  );
}

function Conteudo() {
  const t = useTema();
  const [carregando, setCarregando] = useState(configurado);
  const [sessao, setSessao] = useState<Session | null>(null);

  useEffect(() => {
    if (!configurado) return;
    let ativo = true;
    // A sessão guardada no AsyncStorage volta sozinha (e já renovada, se estava vencendo).
    app
      .sessao()
      .then((s) => ativo && setSessao(s))
      .catch(() => undefined)
      .finally(() => ativo && setCarregando(false));
    // Login, saída e renovação chegam por aqui.
    const parar = app.aoMudar((s) => setSessao(s));
    return () => {
      ativo = false;
      parar();
    };
  }, []);

  const usuario = usuarioDa(sessao);

  return (
    <SafeAreaView style={[estilos.tela, { backgroundColor: t.fundo }]}>
      <StatusBar style="auto" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={estilos.coluna} keyboardShouldPersistTaps="handled">
          <View style={estilos.cabecalho}>
            <View style={estilos.marca}>
              <View style={[estilos.logo, { backgroundColor: t.primaria }]} />
              <Text style={{ color: t.texto, fontSize: 17, fontWeight: '700' }}>Tarefas</Text>
            </View>
            {usuario && (
              <View style={estilos.quem}>
                <Text numberOfLines={1} style={{ color: t.suave, fontSize: 13, flexShrink: 1 }}>
                  {usuario.email}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void app.sair()}
                  style={[estilos.sair, { borderColor: t.bordaForte }]}
                >
                  <Text style={{ color: t.texto, fontSize: 13, fontWeight: '600' }}>Sair</Text>
                </Pressable>
              </View>
            )}
          </View>

          {!configurado ? (
            <Diagnostico />
          ) : carregando ? (
            <Cartao>
              <Carregando texto="Carregando…" />
            </Cartao>
          ) : sessao ? (
            <Tarefas />
          ) : (
            <>
              <Entrar />
              {/* Confere a ligação com o projeto, só em desenvolvimento. */}
              {__DEV__ && <Diagnostico />}
            </>
          )}

          <Text style={[estilos.rodape, { color: t.suave }]}>Template Expo do SuperDB · github.com/superdb-br/templates</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1 },
  coluna: { padding: 20, gap: 16, width: '100%', maxWidth: 560, alignSelf: 'center' },
  cabecalho: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 4 },
  marca: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 22, height: 22, borderRadius: 6 },
  quem: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  sair: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  rodape: { textAlign: 'center', fontSize: 12.5, marginTop: 12 },
});
