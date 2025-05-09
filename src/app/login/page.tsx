'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Login() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  // Verificar se o usuário já está autenticado
  useEffect(() => {
    if (status === 'authenticated' && session) {
      console.log('Usuário já autenticado:', session);
      router.push('/dashboard');
    }
  }, [session, status, router]);

  const handleRegisterClick = () => {
    router.push('/register');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setDebugInfo(null);

    try {
      console.log('Tentando fazer login com:', email);
      
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      console.log('Resultado do login:', result);
      setDebugInfo(JSON.stringify(result, null, 2));

      if (result?.error) {
        setError(`Erro de autenticação: ${result.error}`);
        setIsLoading(false);
        return;
      }

      if (!result?.ok) {
        setError('Falha na autenticação. Por favor, verifique suas credenciais.');
        setIsLoading(false);
        return;
      }

      console.log('Login bem-sucedido, redirecionando para o painel');
      
      // Tentando outro método de redirecionamento - chamada direta para o caminho absoluto com timeout
      setTimeout(() => {
        window.location.replace('/dashboard');
      }, 100);
    } catch (error) {
      console.error('Erro de login:', error);
      setError(`Ocorreu um erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="mx-auto w-full max-w-md space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold">Bem-vindo de volta</h1>
            <p className="text-muted-foreground">Digite suas credenciais para acessar sua conta</p>
            {status === 'loading' && <p>Carregando sessão...</p>}
          </div>
          {error && (
            <div className="rounded-md bg-destructive/15 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
          {debugInfo && (
            <div className="rounded-md bg-blue-100 px-4 py-3 text-sm text-blue-800 overflow-auto max-h-40">
              <pre>{debugInfo}</pre>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium leading-none">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="nome@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium leading-none">
                  Senha
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
              <Button 
                type="button" 
                className="w-full" 
                variant="outline"
                onClick={handleRegisterClick}
              >
                Criar uma conta
              </Button>
            </div>
          </form>
          <div className="mt-4 text-center text-sm">
            Não tem uma conta?{' '}
            <Link href="/register" className="text-primary hover:underline">
              Cadastre-se
            </Link>
          </div>
          <div className="mt-2 text-center text-xs text-muted-foreground">
            Status da sessão: {status}
          </div>
        </div>
      </div>
    </div>
  );
} 