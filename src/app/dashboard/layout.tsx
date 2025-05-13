'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { signOut } from 'next-auth/react';
import { ThemeToggle } from '@/components/ThemeToggle';
import UserProfileButton from '@/components/UserProfileButton';
import NotificationPanel from '@/components/NotificationPanel';
import { Home, CreditCard, BarChart3, PieChart, FolderOpen, LogOut } from 'lucide-react';

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
      <header className="sticky top-0 z-40 border-b bg-background shadow-sm">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-bold text-primary/90">
              WebFinance
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <NotificationPanel />
            <ThemeToggle />
            <UserProfileButton />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-xs gap-1 h-8"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sair</span>
            </Button>
          </div>
        </div>
      </header>
      <div className="container flex-1 items-start md:grid md:grid-cols-[200px_1fr] md:gap-4 lg:grid-cols-[220px_1fr] lg:gap-8">
        <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block">
          <nav className="flex flex-col gap-1 px-2 py-3 text-sm font-medium">
            <Link
              href="/dashboard"
              className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
                isActive('/dashboard') ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
              }`}
            >
              <Home className="h-4 w-4" />
              Painel
            </Link>
            <Link
              href="/dashboard/accounts"
              className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
                isActive('/dashboard/accounts') ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
              }`}
            >
              <FolderOpen className="h-4 w-4" />
              Contas
            </Link>
            <Link
              href="/dashboard/credit-cards"
              className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
                isActive('/dashboard/credit-cards') ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
              }`}
            >
              <CreditCard className="h-4 w-4" />
              Cartões de Crédito
            </Link>
            <Link
              href="/dashboard/transactions"
              className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
                isActive('/dashboard/transactions') ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              Transações
            </Link>
            <Link
              href="/dashboard/categories"
              className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
                isActive('/dashboard/categories') ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
              }`}
            >
              <PieChart className="h-4 w-4" />
              Categorias
            </Link>
            <Link
              href="/dashboard/reports"
              className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
                isActive('/dashboard/reports') ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              Relatórios
            </Link>
          </nav>
        </aside>
        <main className="flex w-full flex-col overflow-hidden py-4">{children}</main>
      </div>
    </div>
  );
} 