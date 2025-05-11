'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/utils';

// Interfaces para os tipos de dados
interface BankAccount {
  id: string;
  name: string;
  initialBalance: number;
  currentBalance: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface CreditCard {
  id: string;
  name: string;
  limit: number;
  dueDay: number;
  closingDay: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
  availableLimit: number;
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: 'INCOME' | 'EXPENSE';
  paymentMethod: 'CASH' | 'CREDIT' | 'DEBIT' | 'FOOD_VOUCHER';
  recurrenceType?: 'SINGLE' | 'INSTALLMENT' | 'RECURRING';
  installments?: number | null;
  currentInstallment?: number | null;
  categoryId: string;
  category: {
    id: string;
    name: string;
    color: string;
    icon?: string;
    type: 'INCOME' | 'EXPENSE';
  };
}

export default function Dashboard() {
  // Estado para dados
  const [isLoading, setIsLoading] = useState(true);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [monthlyData, setMonthlyData] = useState({
    income: 0,
    expenses: 0
  });
  
  // Carregar dados quando o componente montar
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchBankAccounts(),
          fetchCreditCards(),
          fetchRecentTransactions(),
        ]);
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os dados do dashboard.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  // Buscar contas bancárias
  const fetchBankAccounts = async () => {
    try {
      const response = await fetch('/api/bank-accounts');
      if (!response.ok) {
        throw new Error('Falha ao carregar contas bancárias');
      }
      const data = await response.json();
      setBankAccounts(data);
    } catch (error) {
      console.error('Erro ao buscar contas:', error);
      throw error;
    }
  };
  
  // Buscar cartões de crédito
  const fetchCreditCards = async () => {
    try {
      const response = await fetch('/api/credit-cards');
      if (!response.ok) {
        throw new Error('Falha ao carregar cartões de crédito');
      }
      const data = await response.json();
      setCreditCards(data);
    } catch (error) {
      console.error('Erro ao buscar cartões:', error);
      throw error;
    }
  };
  
  // Buscar transações recentes
  const fetchRecentTransactions = async () => {
    try {
      // Pegar o primeiro dia do mês atual
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const formattedFirstDay = firstDay.toISOString().split('T')[0];
      const formattedLastDay = lastDay.toISOString().split('T')[0];
      
      const response = await fetch(`/api/transactions?startDate=${formattedFirstDay}&endDate=${formattedLastDay}`);
      if (!response.ok) {
        throw new Error('Falha ao carregar transações');
      }
      const data = await response.json();
      
      // Filtrar apenas as transações mais recentes (máximo 5)
      const sorted = data.sort((a: Transaction, b: Transaction) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      const recent = sorted.slice(0, 5);
      setRecentTransactions(recent);
      
      // Processar transações para cálculo correto de saldos mensais
      // Agrupar transações recorrentes para evitar contagem duplicada
      const recurringTransactions = new Map<string, Transaction>();
      const installmentTransactions = new Map<string, Transaction>();
      const regularTransactions: Transaction[] = [];
      
      data.forEach((t: Transaction) => {
        // Verificar se a transação é recorrente
        if (t.recurrenceType === 'RECURRING') {
          // Usar uma chave única baseada na descrição, tipo e categoria para evitar duplicação
          const key = `recurring_${t.description}_${t.type}_${t.categoryId || ''}`;
          
          // Se já existe uma transação com esta chave, manter apenas a mais recente
          if (!recurringTransactions.has(key) || 
              new Date(t.date) > new Date(recurringTransactions.get(key)!.date)) {
            recurringTransactions.set(key, t);
          }
        } 
        // Para transações parceladas, tratamos cada parcela como única
        else if (t.recurrenceType === 'INSTALLMENT') {
          const key = `installment_${t.id}`;
          installmentTransactions.set(key, t);
        }
        else {
          // Transações normais (não recorrentes) são mantidas como estão
          regularTransactions.push(t);
        }
      });
      
      // Combinar todas as transações processadas
      const processedTransactions = [
        ...regularTransactions,
        ...Array.from(recurringTransactions.values()),
        ...Array.from(installmentTransactions.values())
      ];
      
      // Calcular receitas e despesas com as transações processadas
      const income = processedTransactions
        .filter((t: Transaction) => t.type === 'INCOME')
        .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
        
      const expenses = processedTransactions
        .filter((t: Transaction) => t.type === 'EXPENSE')
        .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
        
      setMonthlyData({
        income,
        expenses
      });
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
      throw error;
    }
  };
  
  // Calcular totais
  const totalBalance = bankAccounts.reduce(
    (total, account) => total + account.currentBalance,
    0
  );

  const totalCreditLimit = creditCards.reduce(
    (total, card) => total + card.limit,
    0
  );

  const totalAvailableLimit = creditCards.reduce(
    (total, card) => total + card.availableLimit,
    0
  );

  // Se estiver carregando, mostrar um placeholder
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Carregando...</h1>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Painel</h1>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/transactions/new">
            <Button>Adicionar Transação</Button>
          </Link>
        </div>
      </div>

      {/* Alerta para contas bancárias */}
      {!isLoading && bankAccounts.length === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center justify-between">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500 mr-2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            <div>
              <p className="font-medium text-amber-800">Nenhuma conta bancária cadastrada</p>
              <p className="text-sm text-amber-600">Cadastre suas contas bancárias para um controle financeiro completo.</p>
            </div>
          </div>
          <Link href="/dashboard/accounts">
            <Button className="bg-amber-500 hover:bg-amber-600 text-white">
              Cadastrar conta agora
            </Button>
          </Link>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-muted-foreground">
              Saldo Total
            </p>
            <h2 className="text-3xl font-bold">
              R$ {formatCurrency(totalBalance)}
            </h2>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-muted-foreground">
              Receita Mensal
            </p>
            <h2 className="text-3xl font-bold text-green-600">
              R$ {formatCurrency(monthlyData.income)}
            </h2>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-muted-foreground">
              Despesas Mensais
            </p>
            <h2 className="text-3xl font-bold text-red-600">
              R$ {formatCurrency(monthlyData.expenses)}
            </h2>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-muted-foreground">
              Limite Disponível
            </p>
            <h2 className="text-3xl font-bold">
              R$ {formatCurrency(totalAvailableLimit)}
              <span className="text-sm text-muted-foreground">
                /{formatCurrency(totalCreditLimit)}
              </span>
            </h2>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="p-6">
            <h3 className="text-xl font-bold">Contas Bancárias</h3>
            <p className="text-sm text-muted-foreground">
              Seus saldos de conta atuais
            </p>
          </div>
          <div className="px-6 pb-6">
            {bankAccounts.length === 0 ? (
              <p className="py-4 text-center text-muted-foreground">
                Nenhuma conta bancária encontrada
              </p>
            ) : (
              bankAccounts.map((account) => (
                <div 
                  key={account.id}
                  className="flex items-center justify-between border-b py-4 last:border-0"
                >
                  <div>
                    <p className="font-medium">{account.name}</p>
                  </div>
                  <p className="font-medium">R$ {formatCurrency(account.currentBalance)}</p>
                </div>
              ))
            )}
            <div className="mt-4">
              <Link href="/dashboard/accounts">
                <Button variant="outline" size="sm" className="w-full">
                  Gerenciar Contas
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="p-6">
            <h3 className="text-xl font-bold">Cartões de Crédito</h3>
            <p className="text-sm text-muted-foreground">
              Seus limites e uso de cartão de crédito
            </p>
          </div>
          <div className="px-6 pb-6">
            {creditCards.length === 0 ? (
              <p className="py-4 text-center text-muted-foreground">
                Nenhum cartão de crédito encontrado
              </p>
            ) : (
              creditCards.map((card) => (
                <div 
                  key={card.id}
                  className="flex items-center justify-between border-b py-4 last:border-0"
                >
                  <div>
                    <p className="font-medium">{card.name}</p>
                    <div className="mt-1 h-2 w-full rounded-full bg-muted">
                      <div 
                        className="h-2 rounded-full bg-primary" 
                        style={{ width: `${(1 - card.availableLimit / card.limit) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <p className="font-medium">
                    R$ {formatCurrency(card.availableLimit)}
                    <span className="text-sm text-muted-foreground">
                      /{formatCurrency(card.limit)}
                    </span>
                  </p>
                </div>
              ))
            )}
            <div className="mt-4">
              <Link href="/dashboard/credit-cards">
                <Button variant="outline" size="sm" className="w-full">
                  Gerenciar Cartões
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm">
        <div className="p-6">
          <h3 className="text-xl font-bold">Transações Recentes</h3>
          <p className="text-sm text-muted-foreground">
            Sua atividade financeira mais recente
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
                  Descrição
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
                  Data
                </th>
                <th className="px-6 py-3 text-right text-sm font-medium text-muted-foreground">
                  Valor
                </th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-muted-foreground">
                    Nenhuma transação encontrada
                  </td>
                </tr>
              ) : (
                recentTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b">
                    <td className="px-6 py-4 text-sm font-medium">
                      {transaction.description}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {transaction.category?.name || 'Sem categoria'}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {formatDate(transaction.date)}
                    </td>
                    <td className={`px-6 py-4 text-right text-sm font-medium ${
                      transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'INCOME' ? '+' : ''}R$ {formatCurrency(Math.abs(transaction.amount))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-6">
          <Link href="/dashboard/transactions">
            <Button variant="outline" size="sm">
              Ver Todas as Transações
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 