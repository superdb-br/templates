// As três informações que ligam o app ao SEU projeto SuperDB (ver .env.example).

export const config = {
  url: process.env.NEXT_PUBLIC_SUPERDB_URL ?? '',
  anonKey: process.env.NEXT_PUBLIC_SUPERDB_ANON_KEY ?? '',
  projeto: process.env.NEXT_PUBLIC_SUPERDB_PROJECT ?? '',
};

/** Os nomes das variáveis, para a tela inicial dizer exatamente qual falta. */
export const NOMES = {
  url: 'NEXT_PUBLIC_SUPERDB_URL',
  anonKey: 'NEXT_PUBLIC_SUPERDB_ANON_KEY',
  projeto: 'NEXT_PUBLIC_SUPERDB_PROJECT',
};

export const configurado = Boolean(config.url && config.anonKey && config.projeto);
