import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { app } from '../superdb';
import { mensagemDe } from '../lib/superdb/erros';
import { useTema } from '../tema';
import { Botao, Campo, Cartao, Mensagem, Suave, Titulo } from './ui';

type Modo = 'entrar' | 'criar';

export function Entrar() {
  const t = useTema();
  const [modo, setModo] = useState<Modo>('entrar');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar() {
    setEnviando(true);
    setErro(null);
    try {
      // Deu certo: o App recebe a sessão pelo aoMudar e troca de tela sozinho.
      if (modo === 'entrar') await app.entrar(email, senha);
      else await app.criarConta(email, senha);
    } catch (falha) {
      setErro(mensagemDe(falha));
      setEnviando(false);
    }
  }

  const aba = (valor: Modo, rotulo: string) => {
    const ativa = modo === valor;
    return (
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: ativa }}
        onPress={() => {
          setModo(valor);
          setErro(null);
        }}
        style={[estilos.aba, ativa && { backgroundColor: t.superficie }]}
      >
        <Text style={{ color: ativa ? t.texto : t.suave, fontWeight: '600', fontSize: 13.5 }}>{rotulo}</Text>
      </Pressable>
    );
  };

  return (
    <Cartao>
      <View style={{ gap: 4 }}>
        <Titulo>{modo === 'entrar' ? 'Entre para ver suas tarefas' : 'Crie sua conta'}</Titulo>
        <Suave>Cada pessoa só enxerga as próprias tarefas.</Suave>
      </View>

      <View accessibilityRole="tablist" style={[estilos.abas, { backgroundColor: t.superficie2, borderColor: t.borda }]}>
        {aba('entrar', 'Entrar')}
        {aba('criar', 'Criar conta')}
      </View>

      <Campo
        rotulo="E-mail"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      <Campo
        rotulo="Senha"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
        autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
        textContentType={modo === 'entrar' ? 'password' : 'newPassword'}
        dica={modo === 'criar' ? 'Pelo menos 8 caracteres.' : undefined}
        onSubmitEditing={enviar}
      />

      {erro ? <Mensagem texto={erro} /> : null}

      <Botao
        titulo={enviando ? 'Um instante…' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}
        aoTocar={enviar}
        desabilitado={enviando || !email || senha.length < 8}
      />
    </Cartao>
  );
}

const estilos = StyleSheet.create({
  abas: { flexDirection: 'row', padding: 4, gap: 4, borderRadius: 9, borderWidth: 1 },
  aba: { flex: 1, height: 34, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
});
