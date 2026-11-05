// O manifesto (pocket.json) de cada modelo do Pocket e o catálogo que os ordena.
//
// É a fonte de tudo o que fala de um modelo: a página no site
// (bin/gerar-pocket.ts), a lista do painel e o que a imagem do auth embute para
// a rota de aplicar. Um campo torto aqui vira página errada lá, então o
// validador recusa com o nome do campo.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const ETIQUETAS = ['consumo', 'negocio', 'dev', 'pix', 'login', 'pro'] as const;
export type Etiqueta = (typeof ETIQUETAS)[number];

export interface Manifesto {
  slug: string;
  nome: string;
  frase: string;
  descricao: string;
  etiquetas: Etiqueta[];
  tabelas: string[];
  versao: string;
  autor: string;
  ordem: number;
  /** A cor de destaque do app (a mesma do app/tema.css), em #rrggbb: cards e capas da vitrine. */
  cor: string;
  /** Selo "Novo" na vitrine. */
  novo: boolean;
  /** "O que vem pronto": o que o BANCO garante (cada frase provada em tests/sql/pocket-<modelo>.sql). */
  garantias: string[];
  /** Endereço da demo ao vivo (https). Sem ele, a página do modelo esconde o "Ver a demo ao vivo". */
  demo_url: string | null;
}

export const SLUG_VALIDO = /^[a-z0-9][a-z0-9-]{0,38}[a-z0-9]$/;
const TABELA_VALIDA = /^[a-z_][a-z0-9_]{0,62}$/;
const VERSAO_VALIDA = /^\d+\.\d+\.\d+$/;
const COR_VALIDA = /^#[0-9a-f]{6}$/;
const DEMO_VALIDA = /^https:\/\/[a-z0-9.-]+(\/[A-Za-z0-9._~\/-]*)?$/;

const RAIZ_PADRAO = import.meta.dir;

function textoNaoVazio(m: Record<string, unknown>, campo: string): string {
  const v = m[campo];
  if (typeof v !== 'string' || !v.trim()) throw new Error(`manifesto: campo ${campo} precisa ser texto não vazio`);
  return v;
}

export function validarManifesto(entrada: unknown): Manifesto {
  if (!entrada || typeof entrada !== 'object' || Array.isArray(entrada)) {
    throw new Error('manifesto: precisa ser um objeto JSON');
  }
  const m = entrada as Record<string, unknown>;
  const slug = textoNaoVazio(m, 'slug');
  if (!SLUG_VALIDO.test(slug)) throw new Error(`manifesto: campo slug inválido (${slug}); use a-z, 0-9 e hífen, de 2 a 40`);
  const etiquetas = m.etiquetas;
  if (!Array.isArray(etiquetas) || etiquetas.length === 0 || etiquetas.some((e) => !(ETIQUETAS as readonly unknown[]).includes(e))) {
    throw new Error(`manifesto: campo etiquetas só aceita ${ETIQUETAS.join(', ')}`);
  }
  const tabelas = m.tabelas;
  if (!Array.isArray(tabelas) || tabelas.length === 0 || tabelas.some((t) => typeof t !== 'string' || !TABELA_VALIDA.test(t))) {
    throw new Error('manifesto: campo tabelas precisa listar nomes simples, sem schema');
  }
  const versao = textoNaoVazio(m, 'versao');
  if (!VERSAO_VALIDA.test(versao)) throw new Error(`manifesto: campo versao precisa ser semver (${versao})`);
  const ordem = m.ordem;
  if (typeof ordem !== 'number' || !Number.isInteger(ordem) || ordem < 1) {
    throw new Error('manifesto: campo ordem precisa ser inteiro a partir de 1');
  }
  const cor = textoNaoVazio(m, 'cor');
  if (!COR_VALIDA.test(cor)) throw new Error(`manifesto: campo cor precisa ser #rrggbb em minúsculas (${cor})`);
  if (m.novo !== undefined && typeof m.novo !== 'boolean') throw new Error('manifesto: campo novo precisa ser true ou false');
  const garantias = m.garantias ?? [];
  if (!Array.isArray(garantias) || garantias.some((g) => typeof g !== 'string' || !g.trim())) {
    throw new Error('manifesto: campo garantias precisa ser uma lista de frases');
  }
  const demo = m.demo_url ?? null;
  if (demo !== null && (typeof demo !== 'string' || !DEMO_VALIDA.test(demo))) {
    throw new Error('manifesto: campo demo_url precisa ser um endereço https simples (ou ficar de fora)');
  }
  return {
    slug,
    nome: textoNaoVazio(m, 'nome'),
    frase: textoNaoVazio(m, 'frase'),
    descricao: textoNaoVazio(m, 'descricao'),
    etiquetas: etiquetas as Etiqueta[],
    tabelas: tabelas as string[],
    versao,
    autor: textoNaoVazio(m, 'autor'),
    ordem,
    cor,
    novo: m.novo === true,
    garantias: garantias as string[],
    demo_url: demo as string | null,
  };
}

export function slugsDoCatalogo(raiz: string = RAIZ_PADRAO): string[] {
  const { modelos } = JSON.parse(readFileSync(join(raiz, 'catalogo.json'), 'utf8')) as { modelos: string[] };
  return modelos;
}

/** O catálogo com o manifesto de cada modelo, na ordem do catalogo.json. */
export function lerCatalogo(raiz: string = RAIZ_PADRAO): Manifesto[] {
  return slugsDoCatalogo(raiz).map((slug) => {
    const m = validarManifesto(JSON.parse(readFileSync(join(raiz, slug, 'pocket.json'), 'utf8')));
    if (m.slug !== slug) throw new Error(`manifesto: campo slug (${m.slug}) diferente da pasta (${slug})`);
    return m;
  });
}

/** Os nomes das tabelas que um schema.sql cria (CREATE TABLE [IF NOT EXISTS] nome). */
export function tabelasDoSchema(sql: string): string[] {
  const semComentario = sql.replace(/--.*$/gm, '');
  return [...semComentario.matchAll(/\bcreate\s+table\s+(?:if\s+not\s+exists\s+)?"?([a-z_][a-z0-9_]*)"?/gi)].map((m) =>
    m[1]!.toLowerCase(),
  );
}
