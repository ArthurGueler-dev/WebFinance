import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/providers/auth-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import dynamic from 'next/dynamic';

// Importar componentes dinamicamente (apenas do lado do cliente)
const InitScheduler = dynamic(() => import('@/components/InitScheduler'), { ssr: false });
const ResetNotification = dynamic(() => import('@/components/ResetNotification'), { ssr: false });

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'WebFinance',
  description: 'Aplicativo para gestão financeira pessoal',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster />
            <InitScheduler />
            <ResetNotification />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
