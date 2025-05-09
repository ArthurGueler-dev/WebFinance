'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Se estiver autenticado, redirecionar para dashboard
    if (status === 'authenticated') {
      router.push('/dashboard');
    } else {
      setIsLoading(false);
    }
  }, [status, router]);

  if (isLoading && status === 'loading') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">WebFinance</h1>
          <p className="text-xl mb-8">Carregando sua sessão...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
              WebFinance
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="outline">Entrar</Button>
            </Link>
            <Link href="/register">
              <Button>Cadastrar</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 px-4 md:px-6 bg-gradient-to-b from-white to-blue-50">
        <div className="container mx-auto max-w-5xl">
          <div className="grid gap-12 md:grid-cols-2 md:gap-8 items-center">
            <div className="flex flex-col gap-4">
              <h1 className="font-bold text-4xl md:text-5xl lg:text-6xl bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
                Controle suas finanças com facilidade
              </h1>
              <p className="text-lg text-muted-foreground md:text-xl">
                Organize suas despesas, acompanhe seus investimentos e planeje seu futuro financeiro em uma única plataforma intuitiva.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Link href="/register">
                  <Button className="w-full sm:w-auto text-md px-8 py-6">
                    Começar gratuitamente
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" className="w-full sm:w-auto text-md px-8 py-6">
                    Já tenho uma conta
                  </Button>
                </Link>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="w-full max-w-[400px] h-[360px] rounded-lg bg-gradient-to-br from-blue-500 to-teal-400 p-1">
                <div className="w-full h-full bg-white rounded-md flex items-center justify-center">
                  <div className="text-center p-6">
                    <div className="text-3xl font-bold text-blue-600 mb-4">R$ 0,00</div>
                    <div className="space-y-4">
                      <div className="h-4 w-3/4 bg-blue-100 rounded mx-auto"></div>
                      <div className="h-4 w-5/6 bg-teal-100 rounded mx-auto"></div>
                      <div className="h-4 w-2/3 bg-blue-100 rounded mx-auto"></div>
                      <div className="h-4 w-4/5 bg-teal-100 rounded mx-auto"></div>
                      <div className="h-4 w-3/4 bg-blue-100 rounded mx-auto"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 md:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Por que escolher o WebFinance?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Desenvolvido para simplificar sua vida financeira com ferramentas poderosas e intuitivas.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col gap-3 items-center text-center p-6 rounded-lg border bg-card">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <line x1="2" x2="22" y1="10" y2="10" />
                </svg>
              </div>
              <h3 className="text-xl font-medium">Contas e Cartões</h3>
              <p className="text-muted-foreground">
                Gerencie múltiplas contas bancárias e cartões de crédito em um só lugar.
              </p>
            </div>
            
            <div className="flex flex-col gap-3 items-center text-center p-6 rounded-lg border bg-card">
              <div className="h-12 w-12 rounded-full bg-teal-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-600">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <h3 className="text-xl font-medium">Controle de Despesas</h3>
              <p className="text-muted-foreground">
                Categorize seus gastos e visualize para onde seu dinheiro está indo.
              </p>
            </div>
            
            <div className="flex flex-col gap-3 items-center text-center p-6 rounded-lg border bg-card">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                  <path d="M12 2v4M12 18v4M4.93 10H2m20 0h-2.93M16 15.25l1.5 1.5M7.5 7.25l-1.5-1.5M16 8.75l1.5-1.5M7.5 16.75l-1.5 1.5M14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium">Insights Inteligentes</h3>
              <p className="text-muted-foreground">
                Receba análises detalhadas e visualize tendências dos seus hábitos financeiros.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 md:px-6 bg-gradient-to-r from-blue-50 to-teal-50">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold mb-4">Comece a transformar suas finanças hoje</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Junte-se a milhares de pessoas que já estão economizando mais e gerenciando melhor seu dinheiro.
          </p>
          <Link href="/register">
            <Button className="px-8 py-6 text-md">
              Criar minha conta gratuita
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4 md:px-6">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-muted-foreground mb-4 md:mb-0">
            © 2023 WebFinance. Todos os direitos reservados.
          </div>
          <div className="flex gap-6">
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
              Termos de Uso
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
              Privacidade
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
              Contato
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
