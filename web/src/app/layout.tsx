import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Streaming Chat',
  description: 'Chat com streaming real de LLMs, NestJS e SSE',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="pt-BR">
      <body className="h-full bg-gray-950">{children}</body>
    </html>
  );
}
