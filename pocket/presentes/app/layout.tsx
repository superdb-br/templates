import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SeloSuperDB } from './_componentes/SeloSuperDB';
import './estilo.css';
import './pocket.css';

export const metadata: Metadata = {
  title: 'Lista de presentes · modelo do Pocket SuperDB',
  description: 'Lista de presentes paga por Pix direto na conta de quem recebe.',
  icons: { icon: '/favicon.svg' },
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
