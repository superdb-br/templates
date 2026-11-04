// "Feito com SuperDB", no rodapé. Pode tirar: passe `esconder` ou apague a linha
// do layout. Se deixar, quem gostar do seu app chega ao SuperDB por ele.

import { MODELO } from '@/lib/modelo';

export function SeloSuperDB({ esconder = false }: { esconder?: boolean }) {
  if (esconder) return null;
  const destino = `https://superdb.com.br/?utm_source=pocket&utm_medium=selo&utm_content=${MODELO.slug}`;
  return (
    <a className="selo-superdb" href={destino} target="_blank" rel="noreferrer">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/favicon.svg" alt="" width={14} height={14} />
      Feito com SuperDB
    </a>
  );
}
