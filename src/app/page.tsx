'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Se estiver autenticado, redirecionar para dashboard
    if (status === 'authenticated') {
      console.log('Usuário autenticado, redirecionando para dashboard');
      window.location.href = '/dashboard';
    } else if (status === 'unauthenticated') {
      // Se não estiver autenticado, redirecionar para login
      console.log('Usuário não autenticado, redirecionando para login');
      window.location.href = '/login';
    }
  }, [status, router]);

  // Página de carregamento enquanto verifica a sessão
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">WebFinance</h1>
        <p className="text-xl mb-8">Carregando sua sessão...</p>
        <p>Status atual: {status}</p>
      </div>
    </div>
  );
}
