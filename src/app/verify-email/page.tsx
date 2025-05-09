'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

export default function VerifyEmail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const email = searchParams?.get('email');
        const token = searchParams?.get('token');

        if (!email || !token) {
          setError('Link de verificação inválido. Verifique se você usou o link completo do email.');
          setIsVerifying(false);
          return;
        }

        const response = await fetch('/api/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, token }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Não foi possível verificar seu email');
        }

        setIsSuccess(true);
        toast({
          title: 'Sucesso!',
          description: 'Seu email foi verificado com sucesso.',
        });

        // Redirecionar para a página de login após 3 segundos
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } catch (error) {
        console.error('Erro na verificação:', error);
        setError(error instanceof Error ? error.message : 'Ocorreu um erro ao verificar seu email');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  if (isVerifying) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Verificando seu email...</h1>
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 mx-auto rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Email Verificado!</h1>
          <p className="mb-6 text-gray-600">Sua conta foi ativada com sucesso. Você será redirecionado para a página de login.</p>
          <Link href="/login">
            <Button className="w-full">Ir para o Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 mx-auto rounded-full flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">Verificação Falhou</h1>
        <p className="mb-6 text-gray-600">{error || 'Não foi possível verificar seu email.'}</p>
        <div className="space-y-3">
          <Link href="/login">
            <Button variant="outline" className="w-full">Ir para o Login</Button>
          </Link>
          <Link href="/register">
            <Button className="w-full">Criar Nova Conta</Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 