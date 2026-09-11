// Peças de interface usadas pelas três telas: cartão, botão, campo e mensagem.

import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { useTema } from '../tema';

export function Cartao({ children }: { children: ReactNode }) {
  const t = useTema();
  return <View style={[estilos.cartao, { backgroundColor: t.superficie, borderColor: t.borda }]}>{children}</View>;
}

export function Titulo({ children }: { children: ReactNode }) {
  const t = useTema();
  return (
    <Text accessibilityRole="header" style={[estilos.titulo, { color: t.texto }]}>
      {children}
    </Text>
  );
}

export function Suave({ children, pequeno }: { children: ReactNode; pequeno?: boolean }) {
  const t = useTema();
  return <Text style={{ color: t.suave, fontSize: pequeno ? 13 : 15, lineHeight: pequeno ? 18 : 21 }}>{children}</Text>;
}

export function Botao({
  titulo,
  aoTocar,
  desabilitado,
  secundario,
}: {
  titulo: string;
  aoTocar: () => void;
  desabilitado?: boolean;
  secundario?: boolean;
}) {
  const t = useTema();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!desabilitado }}
      disabled={desabilitado}
      onPress={aoTocar}
      style={({ pressed }) => [
        estilos.botao,
        secundario
          ? { backgroundColor: 'transparent', borderColor: t.bordaForte, borderWidth: 1 }
          : { backgroundColor: t.primaria },
        (pressed || desabilitado) && { opacity: desabilitado ? 0.55 : 0.85 },
      ]}
    >
      <Text style={{ color: secundario ? t.texto : t.sobrePrimaria, fontWeight: '600', fontSize: 15 }}>{titulo}</Text>
    </Pressable>
  );
}

export function Campo({ rotulo, dica, ...props }: TextInputProps & { rotulo: string; dica?: string }) {
  const t = useTema();
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: t.texto, fontSize: 13, fontWeight: '600' }}>{rotulo}</Text>
      <TextInput
        accessibilityLabel={rotulo}
        placeholderTextColor={t.suave}
        style={[estilos.entrada, { borderColor: t.bordaForte, color: t.texto, backgroundColor: t.superficie }]}
        {...props}
      />
      {dica ? <Text style={{ color: t.suave, fontSize: 12.5 }}>{dica}</Text> : null}
    </View>
  );
}

export function Mensagem({ texto, tipo = 'erro' }: { texto: string; tipo?: 'erro' | 'aviso' }) {
  const t = useTema();
  return (
    <Text
      accessibilityRole="alert"
      style={[
        estilos.mensagem,
        tipo === 'erro' ? { backgroundColor: t.perigoFundo, color: t.perigo } : { backgroundColor: t.avisoFundo, color: t.aviso },
      ]}
    >
      {texto}
    </Text>
  );
}

export function Carregando({ texto }: { texto: string }) {
  const t = useTema();
  return (
    <View style={estilos.carregando}>
      <ActivityIndicator color={t.primaria} />
      <Text style={{ color: t.suave }}>{texto}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  cartao: { borderWidth: 1, borderRadius: 14, padding: 20, gap: 14 },
  titulo: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  botao: { height: 44, borderRadius: 9, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  entrada: { height: 44, borderWidth: 1, borderRadius: 9, paddingHorizontal: 12, fontSize: 15 },
  mensagem: { padding: 10, borderRadius: 9, fontSize: 13.5, overflow: 'hidden' },
  carregando: { flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', paddingVertical: 28 },
});
