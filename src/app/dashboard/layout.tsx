'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { signOut } from 'next-auth/react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-bold">
              WebFinance
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-sm"
            >
              Sair
            </Button>
          </div>
        </div>
      </header>
      <div className="container flex-1 items-start md:grid md:grid-cols-[220px_1fr] md:gap-6 lg:grid-cols-[240px_1fr] lg:gap-10">
        <aside className="fixed top-16 z-30 -ml-2 hidden h-[calc(100vh-4rem)] w-full shrink-0 md:sticky md:block">
          <nav className="grid items-start px-2 py-4 text-sm font-medium">
            <Link
              href="/dashboard"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                isActive('/dashboard') ? 'bg-muted' : 'hover:bg-muted'
              }`}
            >
              Painel
            </Link>
            <Link
              href="/dashboard/accounts"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                isActive('/dashboard/accounts') ? 'bg-muted' : 'hover:bg-muted'
              }`}
            >
              Contas
            </Link>
            <Link
              href="/dashboard/credit-cards"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                isActive('/dashboard/credit-cards') ? 'bg-muted' : 'hover:bg-muted'
              }`}
            >
              Cartões de Crédito
            </Link>
            <Link
              href="/dashboard/transactions"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                isActive('/dashboard/transactions') ? 'bg-muted' : 'hover:bg-muted'
              }`}
            >
              Transações
            </Link>
            <Link
              href="/dashboard/categories"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                isActive('/dashboard/categories') ? 'bg-muted' : 'hover:bg-muted'
              }`}
            >
              Categorias
            </Link>
            <Link
              href="/dashboard/reports"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                isActive('/dashboard/reports') ? 'bg-muted' : 'hover:bg-muted'
              }`}
            >
              Relatórios
            </Link>
          </nav>
        </aside>
        <main className="flex w-full flex-col overflow-hidden py-6">{children}</main>
      </div>
    </div>
  );
} 