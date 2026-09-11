// Tudo roda no navegador: é lá que a sessão vive (localStorage). Sem SSR, o
// build vira arquivos estáticos e não há servidor Node para manter.
export const ssr = false;
export const prerender = false;
