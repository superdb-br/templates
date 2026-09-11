// As mesmas cores dos templates web (estilo.css), em tema claro e escuro.

import { useColorScheme } from 'react-native';

const claro = {
  fundo: '#f4f5f2',
  superficie: '#ffffff',
  superficie2: '#f7f8f5',
  borda: '#e2e5df',
  bordaForte: '#c9cec6',
  texto: '#141a16',
  suave: '#5b645e',
  primaria: '#17804f',
  sobrePrimaria: '#ffffff',
  perigo: '#b42318',
  perigoFundo: '#fdf1ef',
  aviso: '#8a5300',
  avisoFundo: '#fff6e5',
  ok: '#17804f',
  okFundo: '#ecf7f1',
};

const escuro: typeof claro = {
  fundo: '#0b0d0c',
  superficie: '#131715',
  superficie2: '#181d1a',
  borda: '#242b27',
  bordaForte: '#343d38',
  texto: '#e9ede9',
  suave: '#9aa39d',
  primaria: '#3ecf8e',
  sobrePrimaria: '#05130c',
  perigo: '#ff8a7a',
  perigoFundo: '#2a1512',
  aviso: '#f5b454',
  avisoFundo: '#2a1f0c',
  ok: '#3ecf8e',
  okFundo: '#10231a',
};

export type Tema = typeof claro;

export function useTema(): Tema {
  return useColorScheme() === 'dark' ? escuro : claro;
}
