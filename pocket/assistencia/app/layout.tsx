import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SeloSuperDB } from './_componentes/SeloSuperDB';
import './estilo.css';
import './pocket.css';
import './tema.css';
// Importado (e não "/icone.svg") para o endereço seguir o basePath.
import icone from '@/public/icone.svg';

export const metadata: Metadata = {
  title: 'Assistência técnica · modelo do Pocket SuperDB',
  description: 'Ordens de serviço, peças com estoque e a NFS-e da mão de obra ao entregar.',
  icons: { icon: icone.src },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="pagina">
          <main className="coluna coluna-larga">
            {children}
            <footer className="rodape">
              <SeloSuperDB />
            </footer>
          </main>
        </div>
      </body>
    </html>
  );
}
