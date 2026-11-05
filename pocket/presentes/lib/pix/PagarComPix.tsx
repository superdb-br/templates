import QRCode from 'qrcode';
import { brCode, reais } from './brcode';

type Props = { chave: string | null; nome: string | null; cidade: string | null; valorCentavos: number; txid?: string };

/**
 * QR Code e "copia e cola" do Pix estático, gerados no servidor. Se a chave do
 * dono estiver faltando ou torta, mostra o aviso em vez de um QR que o banco
 * recusaria.
 */
export async function PagarComPix({ chave, nome, cidade, valorCentavos, txid }: Props) {
  let codigo: string;
  try {
    codigo = brCode({ chave: chave ?? '', nome: nome ?? '', cidade: cidade ?? '', valorCentavos, txid });
  } catch {
    return <p className="mensagem mensagem-aviso">O Pix desta página ainda não foi configurado. Combine o pagamento direto com o dono.</p>;
  }
  const svg = await QRCode.toString(codigo, { type: 'svg', margin: 1, width: 220 });
  return (
    <div className="formulario">
      <p className="numero-grande">{reais(valorCentavos)}</p>
      <div className="pix-qr" role="img" aria-label="QR Code do Pix" dangerouslySetInnerHTML={{ __html: svg }} />
      <label className="campo">
        <span className="rotulo">Pix copia e cola</span>
        <textarea className="entrada pix-copia-cola" readOnly rows={4} value={codigo} />
      </label>
      <p className="dica">O pagamento vai direto para a conta de quem recebe. A confirmação é feita à mão, depois que o dinheiro cai.</p>
    </div>
  );
}
