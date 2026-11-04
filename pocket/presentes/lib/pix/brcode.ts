// BR Code do Pix estático: o "copia e cola" e o conteúdo do QR Code.
//
// O dinheiro vai direto da conta de quem paga para a chave Pix do dono do app.
// Nenhum gateway, nenhuma taxa, e o SuperDB não toca no pagamento. A contrapartida
// é que ninguém confirma o pagamento sozinho: o dono confere no banco e marca como
// recebido no app.
//
// O formato é o EMV QRCPS-MPM, como o Banco Central descreve no Manual do BR Code:
// campos "ID + tamanho (2 dígitos) + valor", e no fim o CRC16-CCITT (polinômio
// 0x1021, valor inicial 0xFFFF) de tudo o que veio antes, incluindo o "6304".
//
// Um QR que o app do banco recusa é venda perdida, então a chave é conferida e
// normalizada antes (telefone ganha +55, e-mail vai para minúsculas, CPF e CNPJ
// têm o dígito verificador conferido) e o nome e a cidade perdem acento e são
// cortados no limite do manual (25 e 15 caracteres).

export type TipoDeChave = 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';

export type DadosDoPix = {
  chave: string;
  nome: string;
  cidade: string;
  /** Em centavos. Sem valor, quem paga digita o valor no app do banco. */
  valorCentavos?: number;
  /** Identificador que aparece no extrato do dono (até 25 letras e números). */
  txid?: string;
};

const DDDS = new Set(
  '11 12 13 14 15 16 17 18 19 21 22 24 27 28 31 32 33 34 35 37 38 41 42 43 44 45 46 47 48 49 51 53 54 55 61 62 63 64 65 66 67 68 69 71 73 74 75 77 79 81 82 83 84 85 86 87 88 89 91 92 93 94 95 96 97 98 99'.split(' '),
);

function cpfValido(d: string): boolean {
  if (!/^\d{11}$/.test(d) || /^(\d)\1{10}$/.test(d)) return false;
  const dv = (n: number) => {
    let soma = 0;
    for (let i = 0; i < n; i++) soma += Number(d[i]) * (n + 1 - i);
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dv(9) === Number(d[9]) && dv(10) === Number(d[10]);
}

function cnpjValido(d: string): boolean {
  if (!/^\d{14}$/.test(d) || /^(\d)\1{13}$/.test(d)) return false;
  const dv = (n: number) => {
    const pesos = n === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const soma = pesos.reduce((s, p, i) => s + p * Number(d[i]), 0);
    const r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return dv(12) === Number(d[12]) && dv(13) === Number(d[13]);
}

/** Telefone brasileiro: DDD válido + 8 dígitos (fixo) ou 9 começando por 9 (celular). */
function telefoneNacional(d: string): string | null {
  if (!DDDS.has(d.slice(0, 2))) return null;
  const numero = d.slice(2);
  if (/^9\d{8}$/.test(numero) || /^[2-5]\d{7}$/.test(numero)) return `+55${d}`;
  return null;
}

/**
 * Confere e normaliza a chave. Lança `Error('chave_pix_invalida')` quando não é
 * nenhum dos cinco tipos (o app mostra "Confira a chave Pix").
 *
 * 11 dígitos sem formatação podem ser CPF ou celular. Vale o CPF quando o dígito
 * verificador confere e a pessoa não escreveu no jeito de telefone (espaço,
 * parênteses ou +55). Para não ter dúvida, escreva o telefone com +55.
 */
export function normalizarChavePix(chave: string): { tipo: TipoDeChave; valor: string } {
  const bruta = String(chave ?? '').trim();
  const invalida = () => new Error('chave_pix_invalida');
  if (!bruta) throw invalida();

  if (bruta.includes('@')) {
    const email = bruta.toLowerCase();
    // Só ASCII: o tamanho de cada campo do BR Code conta caracteres e o CRC conta
    // bytes; com acento, os dois divergem e o banco recusa o QR.
    if (email.length > 77 || !/^[\x21-\x7e]+$/.test(email) || !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(email)) throw invalida();
    return { tipo: 'email', valor: email };
  }

  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bruta)) {
    return { tipo: 'aleatoria', valor: bruta.toLowerCase() };
  }

  if (!/^[\d\s().+/-]+$/.test(bruta)) throw invalida();
  const digitos = bruta.replace(/\D/g, '');

  if (bruta.startsWith('+')) {
    if (!digitos.startsWith('55')) throw invalida();
    const tel = telefoneNacional(digitos.slice(2));
    if (!tel) throw invalida();
    return { tipo: 'telefone', valor: tel };
  }

  const pareceTelefone = /[\s()]/.test(bruta) || /^\d{2}9?\d{4}-\d{4}$/.test(bruta);
  const pareceDocumento = /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d+$/.test(bruta);

  if (digitos.length === 14 && pareceDocumento) {
    if (!cnpjValido(digitos)) throw invalida();
    return { tipo: 'cnpj', valor: digitos };
  }
  if (digitos.length === 11 && pareceDocumento && !pareceTelefone && cpfValido(digitos)) {
    return { tipo: 'cpf', valor: digitos };
  }
  if (digitos.length === 11 && /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(bruta)) throw invalida();

  const semPais = digitos.length >= 12 && digitos.startsWith('55') ? digitos.slice(2) : digitos;
  if (semPais.length === 10 || semPais.length === 11) {
    const tel = telefoneNacional(semPais);
    if (tel) return { tipo: 'telefone', valor: tel };
  }
  throw invalida();
}

/** Sem acento e só com caracteres que todo banco aceita, cortado no limite. */
function textoDoManual(texto: string, limite: number): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9 .,@&'-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, limite)
    .trim();
}

const campo = (id: string, valor: string) => `${id}${String(valor.length).padStart(2, '0')}${valor}`;

/** CRC16-CCITT-FALSE (0x1021, inicial 0xFFFF), em 4 dígitos hexadecimais maiúsculos. */
export function crc16(texto: string): string {
  let crc = 0xffff;
  for (const byte of new TextEncoder().encode(texto)) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function brCode(p: DadosDoPix): string {
  const { valor: chave } = normalizarChavePix(p.chave);
  const nome = textoDoManual(p.nome, 25);
  const cidade = textoDoManual(p.cidade, 15);
  if (!nome) throw new Error('nome_invalido');
  if (!cidade) throw new Error('cidade_invalida');

  let valor = '';
  if (p.valorCentavos !== undefined) {
    if (!Number.isInteger(p.valorCentavos) || p.valorCentavos <= 0 || p.valorCentavos > 99_999_999_99) {
      throw new Error('valor_invalido');
    }
    valor = campo('54', (p.valorCentavos / 100).toFixed(2));
  }
  const txid = (p.txid ?? '').replace(/[^A-Za-z0-9]/g, '').slice(0, 25) || '***';

  const semCrc =
    campo('00', '01') +
    campo('26', campo('00', 'br.gov.bcb.pix') + campo('01', chave)) +
    campo('52', '0000') +
    campo('53', '986') +
    valor +
    campo('58', 'BR') +
    campo('59', nome) +
    campo('60', cidade) +
    campo('62', campo('05', txid)) +
    '6304';
  return semCrc + crc16(semCrc);
}

/** "R$ 12,34", para mostrar ao lado do QR. */
export function reais(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
