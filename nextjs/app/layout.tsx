import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './estilo.css';

export const metadata: Metadata = {
  title: 'Tarefas · Next.js + SuperDB',
  description: 'Template Next.js do SuperDB: login, sessão em cookies e dados protegidos por RLS.',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="pagina">
          <main className="coluna">
            {children}
            <footer className="rodape">
              Template Next.js do SuperDB ·{' '}
              <a href="https://github.com/superdb-br/templates" target="_blank" rel="noreferrer">
                código
              </a>{' '}
              ·{' '}
              <a href="https://superdb.com.br/docs" target="_blank" rel="noreferrer">
                documentação
              </a>
            </footer>
          </main>
        </div>
      </body>
    </html>
  );
}
