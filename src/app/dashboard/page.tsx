'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/utils';
import AppTour from '@/components/AppTour';
import WelcomeModal from '@/components/WelcomeModal';
import WelcomeHeader from '@/components/WelcomeHeader';

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
  cardType?: 'CREDIT' | 'DEBIT' | 'FOOD_VOUCHER';
  userId: string;
  createdAt: string;
  updatedAt: string;
  availableLimit: number;
  isVoucherCard: boolean;
}

interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
  type: 'INCOME' | 'EXPENSE';
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
  bankAccountId?: string | null;
  creditCardId?: string | null;
  category: Category;
  bankAccount?: BankAccount | null;
  creditCard?: CreditCard | null;
}

export default function Dashboard() {
  // Estado para dados
  const [isLoading, setIsLoading] = useState(true);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [monthlyData, setMonthlyData] = useState({
    income: 0,
    expenses: 0,
    expensesByMethod: {
      CASH: 0,
      CREDIT: 0,
      DEBIT: 0,
      FOOD_VOUCHER: 0
    }
  });
  
  // Estado para preferências do usuário
  const [dashboardPrefs, setDashboardPrefs] = useState({
    showExpensesByMethod: true,
    showRecentTransactions: true,
    showCreditCards: true,
    showBankAccounts: true
  });
  
  // Modal de configuração
  const [showConfigModal, setShowConfigModal] = useState(false);
  
  // Estado para o tour guiado
  const [showTour, setShowTour] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  
  // Verificar se é a primeira visita do usuário
  useEffect(() => {
    // Verificar apenas após carregar os dados
    if (!isLoading) {
      const tourCompleted = localStorage.getItem('appTourCompleted');
      if (!tourCompleted) {
        // Se for a primeira visita, mostrar o modal de boas-vindas
        setShowWelcomeModal(true);
      }
    }
  }, [isLoading]);
  
  // Iniciar o tour
  const handleStartTour = () => {
    setShowWelcomeModal(false);
    setShowTour(true);
  };
  
  // Fechar o tour
  const handleCompleteTour = () => {
    setShowTour(false);
    toast({
      title: "Tour concluído!",
      description: "Agora você já conhece as principais funcionalidades do sistema. Bom uso!",
      duration: 5000,
    });
  };
  
  // Pular o tour e modal
  const handleSkipTour = () => {
    setShowWelcomeModal(false);
    localStorage.setItem('appTourCompleted', 'true');
  };
  
  // Carregar preferências do usuário do localStorage
  useEffect(() => {
    const savedPrefs = localStorage.getItem('dashboardPrefs');
    if (savedPrefs) {
      try {
        setDashboardPrefs(JSON.parse(savedPrefs));
      } catch (e) {
        console.error('Erro ao carregar preferências:', e);
      }
    }
  }, []);
  
  // Salvar preferências do usuário no localStorage
  const savePreferences = (prefs: typeof dashboardPrefs) => {
    setDashboardPrefs(prefs);
    localStorage.setItem('dashboardPrefs', JSON.stringify(prefs));
    setShowConfigModal(false);
    
    toast({
      title: "Preferências salvas",
      description: "Seu painel foi personalizado com sucesso.",
      duration: 3000,
    });
  };
  
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
        .reduce((sum: number, t: Transaction) => sum + Math.abs(t.amount), 0);
        
      // Calcular despesas por método de pagamento
      const expensesByMethod = {
        CASH: 0,
        CREDIT: 0,
        DEBIT: 0,
        FOOD_VOUCHER: 0
      };
      
      // Primeiro encontrar cartões de Vale Alimentação
      const foodVoucherCardIds = new Set();
      creditCards
        .filter(card => card.cardType === 'FOOD_VOUCHER')
        .forEach(card => foodVoucherCardIds.add(card.id));
      
      // Calcular despesas por método, considerando transações de cartões VA como FOOD_VOUCHER
      processedTransactions
        .filter((t: Transaction) => t.type === 'EXPENSE')
        .forEach((t: Transaction) => {
          // Se for um cartão de VA, sempre contar como FOOD_VOUCHER
          if (t.creditCardId && foodVoucherCardIds.has(t.creditCardId)) {
            expensesByMethod.FOOD_VOUCHER += Math.abs(t.amount);
          } 
          // Caso contrário, usar o método de pagamento definido
          else if (t.paymentMethod && expensesByMethod.hasOwnProperty(t.paymentMethod)) {
            expensesByMethod[t.paymentMethod as keyof typeof expensesByMethod] += Math.abs(t.amount);
          }
        });
        
      setMonthlyData({
        income,
        expenses,
        expensesByMethod
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

  // Separar cartões de crédito normais dos vales alimentação
  const regularCreditCards = creditCards.filter(card => 
    !card.isVoucherCard && !card.name.includes('[Vale Alimentação]')
  );
  
  const foodVoucherCards = creditCards.filter(card => 
    card.isVoucherCard || card.name.includes('[Vale Alimentação]')
  );

  const totalCreditLimit = regularCreditCards.reduce(
    (total, card) => total + card.limit,
    0
  );

  const totalAvailableLimit = regularCreditCards.reduce(
    (total, card) => total + card.availableLimit,
    0
  );
  
  const totalFoodVoucherLimit = foodVoucherCards.reduce(
    (total, card) => total + card.limit,
    0
  );
  
  const totalAvailableFoodVoucher = foodVoucherCards.reduce(
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
    <div className="space-y-4">
      <WelcomeHeader />
      
      {/* Tour guiado */}
      <AppTour run={showTour} onComplete={handleCompleteTour} />
      
      {/* Modal de boas-vindas */}
      <WelcomeModal 
        open={showWelcomeModal} 
        onStartTour={handleStartTour} 
        onClose={handleSkipTour} 
      />
      
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Painel</h1>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setShowConfigModal(true)} 
            title="Configurar painel"
            className="settings-btn"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </Button>
          <Link href="/dashboard/transactions/new">
            <Button className="add-transaction-btn" size="sm">Adicionar Transação</Button>
          </Link>
        </div>
      </div>

      {/* Alerta para contas bancárias */}
      {!isLoading && bankAccounts.length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex items-center justify-between">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500 mr-2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            <div>
              <p className="font-medium text-amber-800 text-sm">Nenhuma conta bancária cadastrada</p>
              <p className="text-xs text-amber-600">Cadastre suas contas bancárias para um controle financeiro completo.</p>
            </div>
          </div>
          <Link href="/dashboard/accounts">
            <Button className="bg-amber-500 hover:bg-amber-600 text-white" size="sm">
              Cadastrar conta
            </Button>
          </Link>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 dashboard-summary">
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium text-muted-foreground">
              Saldo Total
            </p>
            <h2 className="text-xl font-bold">
              R$ {formatCurrency(totalBalance)}
            </h2>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium text-muted-foreground">
              Receita Mensal
            </p>
            <h2 className="text-xl font-bold text-green-600">
              R$ {formatCurrency(monthlyData.income)}
            </h2>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium text-muted-foreground">
              Despesas Mensais
            </p>
            <h2 className="text-xl font-bold text-red-600">
              R$ {formatCurrency(monthlyData.expenses)}
            </h2>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium text-muted-foreground">
              Limite de Crédito
            </p>
            <h2 className="text-xl font-bold">
              R$ {formatCurrency(totalAvailableLimit)}
              <span className="text-xs text-muted-foreground ml-1">
                /{formatCurrency(totalCreditLimit)}
              </span>
            </h2>
          </div>
        </div>
      </div>
      
      {/* Vale Alimentação */}
      {foodVoucherCards.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <div className="flex flex-col gap-2 mb-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-amber-800">Saldo Vale Alimentação</h3>
                <p className="text-xs text-amber-600">Controle do seu saldo de vale alimentação</p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                  size="sm"
                  onClick={async () => {
                    try {
                      setIsLoading(true);
                      const response = await fetch('/api/credit-cards/reset-food-voucher', {
                        headers: {
                          'x-manual-reset': 'true'
                        }
                      });
                      if (!response.ok) {
                        throw new Error('Falha ao resetar Vale Alimentação');
                      }
                      const data = await response.json();
                      
                      // Atualizar dados após o reset
                      await Promise.all([
                        fetchCreditCards(),
                        fetchRecentTransactions(),
                      ]);
                      
                      toast({
                        title: 'Reset Concluído',
                        description: `${data.resets.length} cartões de VA foram resetados com sucesso.`,
                        duration: 5000,
                      });
                    } catch (error) {
                      console.error('Erro ao resetar VA:', error);
                      toast({
                        title: 'Erro',
                        description: 'Não foi possível resetar os cartões de VA.',
                        variant: 'destructive'
                      });
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                >
                  Resetar VA
                </Button>
                <div className="text-right">
                  <p className="text-lg font-bold text-amber-800">
                    R$ {formatCurrency(totalAvailableFoodVoucher)}
                    <span className="text-xs text-amber-600 ml-1">
                      /{formatCurrency(totalFoodVoucherLimit)}
                    </span>
                  </p>
                  <p className="text-xs text-amber-600">
                    {Math.round((totalAvailableFoodVoucher / totalFoodVoucherLimit) * 100)}% disponível
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-2 h-2 w-full rounded-full bg-amber-100">
              <div 
                className="h-2 rounded-full bg-amber-500" 
                style={{ width: `${(1 - totalAvailableFoodVoucher / totalFoodVoucherLimit) * 100}%` }}
              ></div>
            </div>
            
            {foodVoucherCards.map((card) => (
              <div 
                key={card.id}
                className="flex items-center justify-between border-b border-amber-200 py-2 last:border-0"
              >
                <div className="flex-1 max-w-[60%]">
                  <p className="font-medium text-amber-800 text-sm truncate">{card.name.replace('[Vale Alimentação]', '')}</p>
                  <div className="mt-1 h-1.5 w-full max-w-xs rounded-full bg-amber-100">
                    <div 
                      className="h-1.5 rounded-full bg-amber-500" 
                      style={{ width: `${(1 - card.availableLimit / card.limit) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <p className="font-medium text-amber-800 text-sm">
                  R$ {formatCurrency(card.availableLimit)}
                  <span className="text-xs text-amber-600 ml-1">
                    /{formatCurrency(card.limit)}
                  </span>
                </p>
              </div>
            ))}
            
            <div className="mt-1 text-xs text-amber-700">
              <p>Despesas com vale alimentação em {new Date().toLocaleString('pt-BR', {month: 'long'})}: 
                <strong className="ml-1">R$ {formatCurrency(monthlyData.expensesByMethod.FOOD_VOUCHER)}</strong>
              </p>
              <p className="mt-0.5 text-xs">O saldo do Vale Alimentação é resetado automaticamente no início de cada mês.</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border bg-card shadow-sm bank-accounts">
          <div className="p-4">
            <h3 className="text-lg font-bold">Contas Bancárias</h3>
            <p className="text-xs text-muted-foreground">
              Seus saldos de conta atuais
            </p>
          </div>
          <div className="px-4 pb-4">
            {bankAccounts.length === 0 ? (
              <p className="py-3 text-center text-muted-foreground text-sm">
                Nenhuma conta bancária encontrada
              </p>
            ) : (
              bankAccounts.map((account) => (
                <div 
                  key={account.id}
                  className="flex items-center justify-between border-b py-2 last:border-0"
                >
                  <div>
                    <p className="font-medium text-sm">{account.name}</p>
                  </div>
                  <p className="font-medium text-sm">R$ {formatCurrency(account.currentBalance)}</p>
                </div>
              ))
            )}
            <div className="mt-3">
              <Link href="/dashboard/accounts">
                <Button variant="outline" size="sm" className="w-full text-xs h-8">
                  Gerenciar Contas
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card shadow-sm credit-cards">
          <div className="p-4">
            <h3 className="text-lg font-bold">Cartões de Crédito</h3>
            <p className="text-xs text-muted-foreground">
              Seus limites e uso de cartão de crédito
            </p>
          </div>
          <div className="px-4 pb-4">
            {creditCards.length === 0 ? (
              <p className="py-3 text-center text-muted-foreground text-sm">
                Nenhum cartão de crédito encontrado
              </p>
            ) : (
              // Filtrando para mostrar apenas cartões de crédito regulares
              creditCards
                .filter(card => card.cardType !== 'FOOD_VOUCHER')
                .map((card) => (
                  <div 
                    key={card.id}
                    className="flex items-center justify-between border-b py-2 last:border-0"
                  >
                    <div className="flex-1 max-w-[60%]">
                      <p className="font-medium text-sm truncate">
                        {card.name}
                      </p>
                      <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
                        <div 
                          className="h-1.5 rounded-full bg-primary"
                          style={{ width: `${(1 - card.availableLimit / card.limit) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <p className="font-medium text-sm">
                      R$ {formatCurrency(card.availableLimit)}
                      <span className="text-xs text-muted-foreground ml-1">
                        /{formatCurrency(card.limit)}
                      </span>
                    </p>
                  </div>
                ))
            )}
            <div className="mt-3">
              <Link href="/dashboard/credit-cards">
                <Button variant="outline" size="sm" className="w-full text-xs h-8">
                  Gerenciar Cartões
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Vale Alimentação Section */}
      {creditCards.filter(card => card.cardType === 'FOOD_VOUCHER').length > 0 && (
        <div className="rounded-xl border bg-card shadow-sm border-amber-200 food-voucher">
          <div className="p-6">
            <h3 className="text-xl font-bold text-amber-700">Vale Alimentação</h3>
            <p className="text-sm text-muted-foreground">
              Seus limites e uso de cartões de vale alimentação
            </p>
          </div>
          <div className="px-6 pb-6">
            {creditCards
              .filter(card => card.cardType === 'FOOD_VOUCHER')
              .map((card) => (
                <div 
                  key={card.id}
                  className="flex items-center justify-between border-b py-4 last:border-0"
                >
                  <div>
                    <p className="font-medium">
                      {card.name}
                    </p>
                    <div className="mt-1 h-2 w-full rounded-full bg-muted">
                      <div 
                        className="h-2 rounded-full bg-amber-500"
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
            }
          </div>
        </div>
      )}

      <div className="rounded-lg border bg-card shadow-sm transactions-section">
        <div className="p-4">
          <h3 className="text-lg font-bold flex items-center justify-between">
            <span>Transações Recentes</span>
            <Link href="/dashboard/transactions">
              <Button variant="ghost" size="sm" className="text-xs h-7 px-2">
                Ver todas
              </Button>
            </Link>
          </h3>
          <p className="text-xs text-muted-foreground mb-2">
            Sua atividade financeira mais recente
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                  Descrição
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                  Categoria
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                  Data
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">
                  Valor
                </th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-center text-sm text-muted-foreground">
                    Nenhuma transação encontrada
                  </td>
                </tr>
              ) : (
                recentTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b hover:bg-muted/30">
                    <td className="px-4 py-2 text-xs font-medium">
                      {transaction.description}
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {transaction.category?.name || 'Sem categoria'}
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {formatDate(transaction.date)}
                    </td>
                    <td className={`px-4 py-2 text-right text-xs font-medium ${
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
      </div>

      {/* Expenses by Payment Method */}
      {dashboardPrefs.showExpensesByMethod && monthlyData.expenses > 0 && (
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="mb-3">
            <h3 className="text-lg font-bold">Despesas por Método de Pagamento</h3>
            <p className="text-xs text-muted-foreground">
              Distribuição das suas despesas mensais por método de pagamento
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            {monthlyData.expensesByMethod.CREDIT > 0 && (
              <div className="p-3 rounded-lg border bg-background">
                <p className="text-xs font-medium text-muted-foreground">Cartão de Crédito</p>
                <p className="text-base font-bold mt-1">R$ {formatCurrency(monthlyData.expensesByMethod.CREDIT)}</p>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted">
                  <div 
                    className="h-1.5 rounded-full bg-blue-500" 
                    style={{ 
                      width: `${(monthlyData.expensesByMethod.CREDIT / monthlyData.expenses) * 100}%` 
                    }}
                  ></div>
                </div>
                <p className="text-xs text-right mt-1">
                  {Math.round((monthlyData.expensesByMethod.CREDIT / monthlyData.expenses) * 100)}% do total
                </p>
              </div>
            )}
            
            {monthlyData.expensesByMethod.DEBIT > 0 && (
              <div className="p-3 rounded-lg border bg-background">
                <p className="text-xs font-medium text-muted-foreground">Cartão de Débito</p>
                <p className="text-base font-bold mt-1">R$ {formatCurrency(monthlyData.expensesByMethod.DEBIT)}</p>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted">
                  <div 
                    className="h-1.5 rounded-full bg-green-500" 
                    style={{ 
                      width: `${(monthlyData.expensesByMethod.DEBIT / monthlyData.expenses) * 100}%` 
                    }}
                  ></div>
                </div>
                <p className="text-xs text-right mt-1">
                  {Math.round((monthlyData.expensesByMethod.DEBIT / monthlyData.expenses) * 100)}% do total
                </p>
              </div>
            )}
            
            {monthlyData.expensesByMethod.FOOD_VOUCHER > 0 && (
              <div className="p-3 rounded-lg border bg-background border-amber-200">
                <p className="text-xs font-medium text-amber-700">Vale Alimentação</p>
                <p className="text-base font-bold mt-1">R$ {formatCurrency(monthlyData.expensesByMethod.FOOD_VOUCHER)}</p>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted">
                  <div 
                    className="h-1.5 rounded-full bg-amber-500" 
                    style={{ 
                      width: `${(monthlyData.expensesByMethod.FOOD_VOUCHER / monthlyData.expenses) * 100}%` 
                    }}
                  ></div>
                </div>
                <p className="text-xs text-right mt-1">
                  {Math.round((monthlyData.expensesByMethod.FOOD_VOUCHER / monthlyData.expenses) * 100)}% do total
                </p>
              </div>
            )}
            
            {monthlyData.expensesByMethod.CASH > 0 && (
              <div className="p-3 rounded-lg border bg-background">
                <p className="text-xs font-medium text-muted-foreground">Dinheiro</p>
                <p className="text-base font-bold mt-1">R$ {formatCurrency(monthlyData.expensesByMethod.CASH)}</p>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted">
                  <div 
                    className="h-1.5 rounded-full bg-purple-500" 
                    style={{ 
                      width: `${(monthlyData.expensesByMethod.CASH / monthlyData.expenses) * 100}%` 
                    }}
                  ></div>
                </div>
                <p className="text-xs text-right mt-1">
                  {Math.round((monthlyData.expensesByMethod.CASH / monthlyData.expenses) * 100)}% do total
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Personalizar painel</h2>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowConfigModal(false)}
                className="h-8 w-8"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Escolha quais elementos deseja visualizar no seu painel principal.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                <label htmlFor="showExpensesByMethod" className="text-sm font-medium flex-1 cursor-pointer">
                  Mostrar gastos por método de pagamento
                </label>
                <div className="relative">
                  <input
                    type="checkbox"
                    id="showExpensesByMethod"
                    checked={dashboardPrefs.showExpensesByMethod}
                    onChange={(e) => setDashboardPrefs({
                      ...dashboardPrefs,
                      showExpensesByMethod: e.target.checked
                    })}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                <label htmlFor="showRecentTransactions" className="text-sm font-medium flex-1 cursor-pointer">
                  Mostrar transações recentes
                </label>
                <div className="relative">
                  <input
                    type="checkbox"
                    id="showRecentTransactions"
                    checked={dashboardPrefs.showRecentTransactions}
                    onChange={(e) => setDashboardPrefs({
                      ...dashboardPrefs,
                      showRecentTransactions: e.target.checked
                    })}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                <label htmlFor="showCreditCards" className="text-sm font-medium flex-1 cursor-pointer">
                  Mostrar cartões de crédito
                </label>
                <div className="relative">
                  <input
                    type="checkbox"
                    id="showCreditCards"
                    checked={dashboardPrefs.showCreditCards}
                    onChange={(e) => setDashboardPrefs({
                      ...dashboardPrefs,
                      showCreditCards: e.target.checked
                    })}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                <label htmlFor="showBankAccounts" className="text-sm font-medium flex-1 cursor-pointer">
                  Mostrar contas bancárias
                </label>
                <div className="relative">
                  <input
                    type="checkbox"
                    id="showBankAccounts"
                    checked={dashboardPrefs.showBankAccounts}
                    onChange={(e) => setDashboardPrefs({
                      ...dashboardPrefs,
                      showBankAccounts: e.target.checked
                    })}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-5 border-t pt-4">
              <Button variant="outline" onClick={() => setShowConfigModal(false)} size="sm">
                Cancelar
              </Button>
              <Button onClick={() => savePreferences(dashboardPrefs)} size="sm">
                Salvar preferências
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 