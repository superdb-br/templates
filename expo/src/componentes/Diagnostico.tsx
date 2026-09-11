import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NOMES, config } from '../superdb';
import { diagnosticar, type Passo } from '../lib/superdb/diagnostico';
import { useTema } from '../tema';
import { Botao, Cartao, Carregando } from './ui';

const ICONE = { ok: '✓', falta: '✕', aviso: '!' } as const;

/** Confere variáveis, projeto e tabela, e diz o que falta. */
export function Diagnostico() {
  const t = useTema();
  const [passos, setPassos] = useState<Passo[] | null>(null);

  const conferir = useCallback(() => {
    setPassos(null);
    void diagnosticar(config, NOMES).then(setPassos);
  }, []);

  useEffect(conferir, [conferir]);

  const cor = (estado: Passo['estado']) =>
    estado === 'ok' ? [t.okFundo, t.ok] : estado === 'falta' ? [t.perigoFundo, t.perigo] : [t.avisoFundo, t.aviso];

  return (
    <Cartao>
      <Text style={[estilos.secao, { color: t.suave }]}>CONEXÃO COM O SUPERDB</Text>
      {!passos ? (
        <Carregando texto="Conferindo…" />
      ) : (
        <>
          {passos.map((p) => {
            const [fundo, frente] = cor(p.estado);
            return (
              <View key={p.id} style={estilos.passo}>
                <View style={[estilos.icone, { backgroundColor: fundo }]}>
                  <Text style={{ color: frente, fontWeight: '700', fontSize: 12 }}>{ICONE[p.estado]}</Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ color: t.texto, fontWeight: '600', fontSize: 13.5 }}>{p.titulo}</Text>
                  <Text style={{ color: t.suave, fontSize: 13, lineHeight: 18 }}>{p.detalhe}</Text>
                </View>
              </View>
            );
          })}
          {passos[0]?.estado === 'falta' && (
            <Text style={[estilos.codigo, { backgroundColor: t.superficie2, borderColor: t.borda, color: t.texto }]}>
              {`# .env  (depois, reinicie o npx expo start)\n${NOMES.url}=https://auth.superdb.com.br\n${NOMES.anonKey}=cole-a-chave-anon-aqui\n${NOMES.projeto}=slug-do-projeto`}
            </Text>
          )}
          {passos.some((p) => p.estado !== 'ok') && <Botao titulo="Conferir de novo" aoTocar={conferir} secundario />}
        </>
      )}
    </Cartao>
  );
}

const estilos = StyleSheet.create({
  secao: { fontSize: 12.5, fontWeight: '700', letterSpacing: 0.4 },
  passo: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  icone: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  codigo: { fontFamily: 'Menlo', fontSize: 12, lineHeight: 18, padding: 12, borderRadius: 9, borderWidth: 1 },
});
