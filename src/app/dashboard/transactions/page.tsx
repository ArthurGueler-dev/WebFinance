'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/utils';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';

// Interfaces para os tipos de dados
interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: 'INCOME' | 'EXPENSE';
  paymentMethod: 'CASH' | 'CREDIT' | 'DEBIT' | 'FOOD_VOUCHER';
  recurrenceType: 'SINGLE' | 'INSTALLMENT' | 'RECURRING';
  installments?: number | null;
  currentInstallment?: number | null;
  categoryId: string;
  category: {
    id: string;
    name: string;
    color: string;
    icon?: string | null;
    type: 'INCOME' | 'EXPENSE';
  };
  bankAccount?: {
    id: string;
    name: string;
  } | null;
  creditCard?: {
    id: string;
    name: string;
  } | null;
}

interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string | null;
  type: 'INCOME' | 'EXPENSE';
}

interface BankAccount {
  id: string;
  name: string;
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
  isVoucherCard?: boolean;
}

export default function Transactions() {
  // Estado para dados
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);
  
  // Estado para seleção múltipla
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [showMultiDeleteDialog, setShowMultiDeleteDialog] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    description: '',
    categoryId: '',
    startDate: '',
    endDate: '',
  });

  // Buscar dados quando o componente montar
  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchTransactions(),
          fetchCategories(),
          fetchBankAccounts(),
          fetchCreditCards(),
        ]);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os dados necessários.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAllData();
  }, []);

  // Buscar transações
  const fetchTransactions = async () => {
    try {
      // Construir URL com parâmetros de filtro
      let url = '/api/transactions';
      const params = new URLSearchParams();
      
      if (filters.description) {
        params.append('description', filters.description);
      }
      
      if (filters.categoryId) {
        params.append('categoryId', filters.categoryId);
      }
      
      if (filters.startDate) {
        params.append('startDate', filters.startDate);
      }
      
      if (filters.endDate) {
        params.append('endDate', filters.endDate);
      }
      
      // Adicionar parâmetros à URL se existirem
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Falha ao carregar transações');
      }
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
      throw error;
    }
  };

  // Buscar categorias
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error('Falha ao carregar categorias');
      }
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      throw error;
    }
  };

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
      console.error('Erro ao buscar contas bancárias:', error);
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
      console.error('Erro ao buscar cartões de crédito:', error);
      throw error;
    }
  };

  // Handle filters change
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
    
    // Se o campo for descrição, aplicar busca em tempo real
    if (name === 'description') {
      // Esperar um curto intervalo antes de buscar, para evitar muitas requisições
      const debounceTimer = setTimeout(() => {
        // Buscar transações com o novo valor de descrição
        fetchTransactions().catch(error => {
          console.error('Erro ao buscar transações:', error);
        });
      }, 300); // 300ms de espera
      
      // Limpar timeout ao digitar novamente
      return () => clearTimeout(debounceTimer);
    }
  };

  // Aplicar filtros
  const handleApplyFilters = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await fetchTransactions();
    } catch (error) {
      console.error('Erro ao aplicar filtros:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível aplicar os filtros.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Limpar filtros
  const handleClearFilters = () => {
    setFilters({
      description: '',
      categoryId: '',
      startDate: '',
      endDate: '',
    });
    
    // Recarregar transações sem filtros
    fetchTransactions();
  };

  // Excluir transação
  const handleDeleteTransaction = async () => {
    if (!currentTransaction) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/transactions/${currentTransaction.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Falha ao excluir transação');
      }
      
      // Atualizar lista após exclusão
      setTransactions(transactions.filter(t => t.id !== currentTransaction.id));
      setShowDeleteDialog(false);
      
      toast({
        title: "Transação excluída com sucesso",
        description: `A transação ${currentTransaction.description} foi excluída.`
      });
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao excluir a transação.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Excluir múltiplas transações
  const handleDeleteMultipleTransactions = async () => {
    if (selectedTransactions.size === 0) return;
    
    setIsLoading(true);
    
    try {
      const deletePromises = Array.from(selectedTransactions).map(id => 
        fetch(`/api/transactions/${id}`, {
          method: 'DELETE',
        })
      );
      
      const results = await Promise.allSettled(deletePromises);
      
      // Contar sucessos e falhas
      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      // Filtrar transações que foram excluídas com sucesso
      const successfullyDeletedIds = new Set();
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const id = Array.from(selectedTransactions)[index];
          successfullyDeletedIds.add(id);
        }
      });
      
      setTransactions(transactions.filter(t => !successfullyDeletedIds.has(t.id)));
      
      // Limpar seleção
      setSelectedTransactions(new Set());
      setShowMultiDeleteDialog(false);
      
      toast({
        title: "Transações excluídas",
        description: `${succeeded} transações foram excluídas com sucesso. ${failed > 0 ? `${failed} transações falharam.` : ''}`,
        variant: failed > 0 ? "destructive" : "default"
      });
    } catch (error) {
      console.error('Erro ao excluir transações:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao tentar excluir as transações.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Selecionar/desselecionar uma transação
  const toggleTransactionSelection = (id: string) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTransactions(newSelected);
  };

  // Selecionar/desselecionar todas as transações
  const toggleSelectAll = () => {
    if (selectedTransactions.size === transactions.length) {
      // Se todas estão selecionadas, desmarca todas
      setSelectedTransactions(new Set());
    } else {
      // Caso contrário, marca todas
      setSelectedTransactions(new Set(transactions.map(t => t.id)));
    }
  };

  // Calcular totais
  // Para transações recorrentes (salário, etc.), agrupe por mês para evitar contagem duplicada
  const calculateTotals = () => {
    // Mapa para armazenar transações únicas por mês
    // Chave externa: ano-mês, valor: outro mapa
    // Chave interna: id da transação ou chave única para recorrentes, valor: transação
    const monthlyTransactions = new Map<string, Map<string, Transaction>>();
    
    // Identificar cartões de Vale Alimentação
    const foodVoucherCardIds = new Set();
    creditCards
      .filter(card => card.name.includes('[Vale Alimentação]') || card.isVoucherCard === true)
      .forEach(card => foodVoucherCardIds.add(card.id));
    
    // Agrupar transações por mês
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      
      if (!monthlyTransactions.has(monthKey)) {
        monthlyTransactions.set(monthKey, new Map());
      }
      
      const monthMap = monthlyTransactions.get(monthKey)!;
      
      // Para transações recorrentes, use uma chave única
      let key = transaction.id;
      if (transaction.recurrenceType === 'RECURRING') {
        key = `recurring_${transaction.description}_${transaction.categoryId}`;
      }
      
      // Se não existe ou esta é mais recente, atualizar o mapa
      if (!monthMap.has(key) || new Date(transaction.date) > new Date(monthMap.get(key)!.date)) {
        monthMap.set(key, transaction);
      }
    });
    
    let incomeTotal = 0;
    let expenseTotal = 0;
    let foodVoucherTotal = 0;
    
    // Iterar por todos os meses
    monthlyTransactions.forEach(monthMap => {
      // Iterar por todas as transações no mês
      monthMap.forEach(transaction => {
        // Verificar se é uma transação de vale alimentação
        const isFoodVoucher = 
          transaction.paymentMethod === 'FOOD_VOUCHER' || 
          (transaction.creditCard && foodVoucherCardIds.has(transaction.creditCard.id)) ||
          (transaction.description.toLowerCase().includes('vale alimentação') && transaction.type === 'INCOME') ||
          (transaction.description.toLowerCase().includes('va ') && transaction.type === 'INCOME') ||
          (transaction.description.toLowerCase().includes('ticket ') && transaction.type === 'INCOME');
        
        if (transaction.type === 'INCOME') {
          if (isFoodVoucher) {
            // Receitas de VA devem ir para o total de VA, não para income
            foodVoucherTotal += transaction.amount;
          } else {
            incomeTotal += transaction.amount;
          }
        } else {
          // Diferencia entre gastos normais e gastos com vale alimentação
          if (isFoodVoucher) {
            foodVoucherTotal += Math.abs(transaction.amount);
          } else {
            expenseTotal += Math.abs(transaction.amount);
          }
        }
      });
    });
    
    // Calcular saldo (sem considerar transações de vale alimentação no cálculo)
    const balance = incomeTotal - expenseTotal;
    
    return {
      incomeTotal,
      expenseTotal,
      foodVoucherTotal,
      balance
    };
  };
  
  const { incomeTotal, expenseTotal, foodVoucherTotal, balance } = calculateTotals();

  // Formatação de data para exibição
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  // Obter nome da conta ou cartão
  const getAccountName = (transaction: Transaction) => {
    if (transaction.paymentMethod === 'CREDIT' && transaction.creditCard) {
      return transaction.creditCard.name;
    } else if (transaction.paymentMethod === 'FOOD_VOUCHER') {
      return 'Vale Alimentação';
    } else if (transaction.bankAccount) {
      return transaction.bankAccount.name;
    }
    return transaction.paymentMethod === 'CREDIT' ? 'Cartão não especificado' : 'Sem conta associada';
  };

  // Agrupar transações por mês
  const groupTransactionsByMonth = () => {
    const groupedTransactions: {
      monthKey: string;
      monthLabel: string;
      transactions: Transaction[];
      incomeTotal: number;
      expenseTotal: number;
      foodVoucherTotal: number;
    }[] = [];
    
    if (transactions.length === 0) return groupedTransactions;
    
    // Agrupar por mês
    const monthGroups = new Map<string, Transaction[]>();
    
    // Ordenar transações por data (mais recentes primeiro)
    const sortedTransactions = [...transactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    // Identificar cartões de Vale Alimentação
    const foodVoucherCardIds = new Set();
    creditCards
      .filter(card => card.name.includes('[Vale Alimentação]') || card.isVoucherCard === true)
      .forEach(card => foodVoucherCardIds.add(card.id));
    
    // Agrupar por mês
    sortedTransactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthGroups.has(monthKey)) {
        monthGroups.set(monthKey, []);
      }
      
      monthGroups.get(monthKey)!.push(transaction);
    });
    
    // Converter mapa para array e calcular totais por mês
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    // Ordenar meses (mais recentes primeiro)
    const sortedMonthKeys = Array.from(monthGroups.keys()).sort().reverse();
    
    sortedMonthKeys.forEach(monthKey => {
      const [year, month] = monthKey.split('-').map(Number);
      const monthLabel = `${months[month-1]} de ${year}`;
      const monthTransactions = monthGroups.get(monthKey)!;
      
      // Calcular totais do mês
      let incomeTotal = 0;
      let expenseTotal = 0;
      let foodVoucherTotal = 0;
      
      monthTransactions.forEach(transaction => {
        // Verificar se é uma transação de vale alimentação
        const isFoodVoucher = 
          transaction.paymentMethod === 'FOOD_VOUCHER' || 
          (transaction.creditCard && foodVoucherCardIds.has(transaction.creditCard.id)) ||
          (transaction.description.toLowerCase().includes('vale alimentação') && transaction.type === 'INCOME') ||
          (transaction.description.toLowerCase().includes('va ') && transaction.type === 'INCOME') ||
          (transaction.description.toLowerCase().includes('ticket ') && transaction.type === 'INCOME');
        
        if (transaction.type === 'INCOME') {
          if (isFoodVoucher) {
            // Receitas de VA devem ir para o total de VA, não para income
            foodVoucherTotal += transaction.amount;
          } else {
            incomeTotal += transaction.amount;
          }
        } else {
          // Diferencia entre gastos normais e gastos com vale alimentação
          if (isFoodVoucher) {
            foodVoucherTotal -= Math.abs(transaction.amount); // Subtrai do saldo de VA
          } else {
            expenseTotal += Math.abs(transaction.amount);
          }
        }
      });
      
      groupedTransactions.push({
        monthKey,
        monthLabel,
        transactions: monthTransactions,
        incomeTotal,
        expenseTotal,
        foodVoucherTotal
      });
    });
    
    return groupedTransactions;
  };
  
  const groupedTransactions = groupTransactionsByMonth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Transações</h1>
        <div className="flex space-x-2">
          {selectedTransactions.size > 0 && (
            <Button 
              variant="destructive"
              onClick={() => setShowMultiDeleteDialog(true)}
            >
              Excluir ({selectedTransactions.size})
            </Button>
          )}
          <Link href="/dashboard/transactions/new">
            <Button>Adicionar Transação</Button>
          </Link>
        </div>
      </div>

      {/* Alerta para contas bancárias */}
      {bankAccounts.length === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20 p-4 flex items-center justify-between">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500 dark:text-amber-400 mr-2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-400">Nenhuma conta bancária cadastrada</p>
              <p className="text-sm text-amber-600 dark:text-amber-500">Para melhor controle financeiro, recomendamos cadastrar suas contas bancárias.</p>
            </div>
          </div>
          <Link href="/dashboard/accounts">
            <Button variant="outline" className="border-amber-300 hover:border-amber-400 hover:bg-amber-100 dark:border-amber-800 dark:hover:border-amber-700 dark:hover:bg-amber-900/30">
              Cadastrar conta
            </Button>
          </Link>
        </div>
      )}

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-medium">Filtrar Transações</h3>
        <form onSubmit={handleApplyFilters} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium leading-none">
              Descrição
            </label>
            <Input
              id="description"
              name="description"
              value={filters.description}
              onChange={handleFilterChange}
              placeholder="Buscar por descrição"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="categoryId" className="text-sm font-medium leading-none">
              Categoria
            </label>
            <select
              id="categoryId"
              name="categoryId"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={filters.categoryId}
              onChange={handleFilterChange}
            >
              <option value="">Todas as categorias</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="startDate" className="text-sm font-medium leading-none">
              Data Inicial
            </label>
            <Input
              id="startDate"
              name="startDate"
              type="date"
              value={filters.startDate}
              onChange={handleFilterChange}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="endDate" className="text-sm font-medium leading-none">
              Data Final
            </label>
            <Input
              id="endDate"
              name="endDate"
              type="date"
              value={filters.endDate}
              onChange={handleFilterChange}
            />
          </div>
          <div className="flex col-span-1 sm:col-span-2 md:col-span-4 justify-end space-x-2">
            <Button type="button" variant="outline" onClick={handleClearFilters} disabled={isLoading}>
              Limpar Filtros
            </Button>
            <Button type="submit" disabled={isLoading}>
              Aplicar Filtros
            </Button>
          </div>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-muted-foreground">Receitas</p>
            <h2 className="text-2xl font-bold text-green-600">
              +R$ {formatCurrency(incomeTotal)}
            </h2>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-muted-foreground">Despesas</p>
            <h2 className="text-2xl font-bold text-red-600">
              -R$ {formatCurrency(expenseTotal)}
            </h2>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-muted-foreground">Saldo</p>
            <h2 className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {balance >= 0 ? '+' : '-'}R$ {formatCurrency(Math.abs(balance))}
            </h2>
            {foodVoucherTotal > 0 && (
              <p className="text-xs text-muted-foreground">
                Vale Alimentação não afeta o saldo
              </p>
            )}
          </div>
        </div>
      </div>

      {foodVoucherTotal !== 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-900/20 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-300">Vale Alimentação (VA)</h3>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Saldo separado que não impacta suas finanças gerais
              </p>
            </div>
            <div className="flex flex-col items-end">
              <p className="text-sm text-amber-700 dark:text-amber-400">Saldo disponível</p>
              <p className={`text-2xl font-bold ${foodVoucherTotal >= 0 ? 'text-green-600 dark:text-green-300' : 'text-red-600 dark:text-red-300'}`}>
                {foodVoucherTotal >= 0 ? '+' : '-'}R$ {formatCurrency(Math.abs(foodVoucherTotal))}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Informação sobre como os saldos são calculados */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-blue-600 dark:text-blue-400">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-400">Como os saldos são calculados</h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-500">
              <p>
                O saldo mostrado acima é calculado a partir de todas as transações registradas no sistema.
              </p>
              <ul className="list-disc ml-5 mt-1 space-y-1">
                <li>
                  <strong>Saldo de cartão de crédito:</strong> O limite disponível dos cartões é atualizado 
                  automaticamente quando você registra transações de despesa usando o cartão específico.
                </li>
                <li>
                  <strong>Saldo de contas bancárias:</strong> O saldo atual é atualizado quando você registra 
                  transações associadas à conta.
                </li>
                <li>
                  <strong>Vale Alimentação:</strong> Transações marcadas como Vale Alimentação são contabilizadas 
                  separadamente e não afetam o saldo geral.
                </li>
              </ul>
              <p className="mt-2">
                Para manter seus saldos atualizados corretamente, registre todas as suas transações e 
                associe-as às contas ou cartões correspondentes.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={selectedTransactions.size === transactions.length && transactions.length > 0}
                    onChange={toggleSelectAll}
                    disabled={transactions.length === 0}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
                  Descrição
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
                  Conta/Cartão
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
                  Método
                </th>
                <th className="px-6 py-3 text-right text-sm font-medium text-muted-foreground">
                  Valor
                </th>
                <th className="px-6 py-3 text-right text-sm font-medium text-muted-foreground">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-sm text-muted-foreground">
                    Carregando transações...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-sm text-muted-foreground">
                    Nenhuma transação encontrada
                  </td>
                </tr>
              ) : (
                groupedTransactions.map((group) => (
                  <>
                    <tr key={`header-${group.monthKey}`} className="border-b bg-muted/50">
                      <td colSpan={8} className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-lg">{group.monthLabel}</div>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex flex-col items-end">
                              <span className="text-gray-500">Receitas</span>
                              <span className="font-medium text-green-600">+R$ {formatCurrency(group.incomeTotal)}</span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-gray-500">Despesas</span>
                              <span className="font-medium text-red-600">-R$ {formatCurrency(group.expenseTotal)}</span>
                            </div>
                            {group.foodVoucherTotal > 0 && (
                              <div className="flex flex-col items-end">
                                <span className="text-gray-500">Vale Alimentação</span>
                                <span className="font-medium text-amber-600">-R$ {formatCurrency(group.foodVoucherTotal)}</span>
                              </div>
                            )}
                            <div className="flex flex-col items-end">
                              <span className="text-gray-500">Saldo</span>
                              <span className={`font-medium ${group.incomeTotal - group.expenseTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {group.incomeTotal - group.expenseTotal >= 0 ? '+' : '-'}R$ {formatCurrency(Math.abs(group.incomeTotal - group.expenseTotal))}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                    {group.transactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b hover:bg-muted/20 transition-colors">
                        <td className="px-3 py-4">
                          <input
                            type="checkbox"
                            checked={selectedTransactions.has(transaction.id)}
                            onChange={() => toggleTransactionSelection(transaction.id)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {formatDate(transaction.date)}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          {transaction.description}
                          {transaction.recurrenceType !== 'SINGLE' && (
                            <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full">
                              {transaction.recurrenceType === 'INSTALLMENT' 
                                ? `Parcela ${transaction.currentInstallment || 1}/${transaction.installments}` 
                                : 'Recorrente'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="inline-flex items-center gap-2">
                            <span 
                              className="w-7 h-7 flex items-center justify-center rounded-full text-white"
                              style={{ backgroundColor: transaction.category?.color || '#888' }}
                            >
                              {transaction.category?.icon || '?'}
                            </span>
                            <span>{transaction.category?.name || 'Não categorizado'}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {getAccountName(transaction)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {transaction.paymentMethod === 'CREDIT' ? (
                            transaction.creditCard?.name || 'Cartão de Crédito'
                          ) : transaction.paymentMethod === 'FOOD_VOUCHER' ? (
                            <span className="inline-flex items-center gap-1 text-amber-600">
                              <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold">
                                Vale Alimentação
                              </span>
                              {transaction.creditCard?.name?.replace('[Vale Alimentação]', '')}
                            </span>
                          ) : transaction.bankAccount?.name || (
                            transaction.paymentMethod === 'CASH' ? 'Dinheiro' : 'Débito'
                          )}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium">
                          <span className={
                            transaction.paymentMethod === 'FOOD_VOUCHER' 
                              ? 'text-amber-600 dark:text-amber-400'
                              : transaction.amount >= 0 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-red-600 dark:text-red-400'
                          }>
                            {transaction.type === 'INCOME' ? '+' : '-'}R$ {formatCurrency(Math.abs(transaction.amount))}
                            {transaction.paymentMethod === 'FOOD_VOUCHER' && 
                              <span className="ml-1 text-xs">(VA)</span>
                            }
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-sm">
                          <Link href={`/dashboard/transactions/${transaction.id}`}>
                            <Button variant="outline" size="sm" className="mr-2">
                              Editar
                            </Button>
                          </Link>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => {
                              setCurrentTransaction(transaction);
                              setShowDeleteDialog(true);
                            }}
                          >
                            Excluir
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Diálogo de exclusão múltipla */}
      <Dialog open={showMultiDeleteDialog} onOpenChange={setShowMultiDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Transações</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Tem certeza que deseja excluir <strong>{selectedTransactions.size}</strong> transações?
              Esta ação não pode ser desfeita.
            </p>
            {selectedTransactions.size > 0 && (
              <div className="mt-4 max-h-40 overflow-y-auto border rounded-md p-2">
                <p className="text-sm font-medium mb-2">Transações selecionadas:</p>
                <ul className="text-sm space-y-1">
                  {Array.from(selectedTransactions).map(id => {
                    const transaction = transactions.find(t => t.id === id);
                    return transaction ? (
                      <li key={id} className="flex justify-between">
                        <span className="truncate">{transaction.description}</span>
                        <span className={transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}>
                          {transaction.type === 'INCOME' ? '+' : '-'}R$ {formatCurrency(Math.abs(transaction.amount))}
                        </span>
                      </li>
                    ) : null;
                  })}
                </ul>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowMultiDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteMultipleTransactions} disabled={isLoading}>
              {isLoading ? 'Excluindo...' : 'Excluir Transações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de exclusão */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Transação</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Tem certeza que deseja excluir a transação <strong>{currentTransaction?.description}</strong>?
              Esta ação não pode ser desfeita.
            </p>
            {currentTransaction?.recurrenceType === 'INSTALLMENT' && (
              <p className="mt-2 text-amber-600">
                Aviso: Esta é uma transação de parcela {currentTransaction.currentInstallment}/{currentTransaction.installments}.
                Apenas esta parcela será excluída.
              </p>
            )}
            {currentTransaction?.recurrenceType === 'RECURRING' && (
              <p className="mt-2 text-amber-600">
                Aviso: Esta é uma transação recorrente. Apenas esta ocorrência será excluída.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteTransaction} disabled={isLoading}>
              {isLoading ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 