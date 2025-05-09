'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';

// Função para formatar números de forma consistente
const formatCurrency = (value: number): string => {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

// Interfaces para os tipos de dados
interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: 'INCOME' | 'EXPENSE';
  paymentMethod: 'CASH' | 'CREDIT' | 'DEBIT';
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

  // Calcular totais
  // Para transações recorrentes (salário, etc.), agrupe por mês para evitar contagem duplicada
  const calculateTotals = () => {
    // Mapa para armazenar transações únicas por mês
    // Chave externa: ano-mês, valor: outro mapa
    // Chave interna: id da transação ou chave única para recorrentes, valor: transação
    const monthlyTransactions = new Map<string, Map<string, Transaction>>();
    
    // Agrupar transações por mês
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      
      if (!monthlyTransactions.has(monthKey)) {
        monthlyTransactions.set(monthKey, new Map<string, Transaction>());
      }
      
      const monthMap = monthlyTransactions.get(monthKey)!;
      
      // Para transações recorrentes, use uma chave composta para identificar unicamente
      if (transaction.recurrenceType === 'RECURRING') {
        // Chave única baseada na descrição, tipo e categoria
        const key = `recurring_${transaction.description}_${transaction.type}_${transaction.categoryId}`;
        
        // Para transações recorrentes no mesmo mês, manter apenas a mais recente
        if (!monthMap.has(key) || new Date(transaction.date) > new Date(monthMap.get(key)!.date)) {
          monthMap.set(key, transaction);
        }
      } 
      // Para transações de parcelas, tratar cada parcela como única
      else if (transaction.recurrenceType === 'INSTALLMENT') {
        // Chave única para cada parcela
        const key = `installment_${transaction.id}`;
        monthMap.set(key, transaction);
      }
      // Para transações simples (não recorrentes)
      else {
        monthMap.set(transaction.id, transaction);
      }
    });
    
    // Calcular totais usando as transações processadas
    let incomeTotal = 0;
    let expenseTotal = 0;
    
    // Iterar por todos os meses
    monthlyTransactions.forEach(monthMap => {
      // Iterar por todas as transações no mês
      monthMap.forEach(transaction => {
        // Somar receitas
        if (transaction.type === 'INCOME') {
          incomeTotal += transaction.amount;
        } 
        // Somar despesas
        else if (transaction.type === 'EXPENSE') {
          expenseTotal += transaction.amount;
        }
      });
    });
    
    // Calcular o saldo (receitas - despesas)
    const balance = incomeTotal - expenseTotal;
    
    return { incomeTotal, expenseTotal, balance };
  };
  
  const { incomeTotal, expenseTotal, balance } = calculateTotals();

  // Formatação de data para exibição
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  // Obter nome da conta ou cartão
  const getAccountName = (transaction: Transaction) => {
    if (transaction.paymentMethod === 'CREDIT' && transaction.creditCard) {
      return transaction.creditCard.name;
    } else if (transaction.bankAccount) {
      return transaction.bankAccount.name;
    }
    return transaction.paymentMethod === 'CREDIT' ? 'Cartão não especificado' : 'Sem conta associada';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Transações</h1>
        <Link href="/dashboard/transactions/new">
          <Button>Adicionar Transação</Button>
        </Link>
      </div>

      {/* Alerta para contas bancárias */}
      {bankAccounts.length === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center justify-between">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500 mr-2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            <div>
              <p className="font-medium text-amber-800">Nenhuma conta bancária cadastrada</p>
              <p className="text-sm text-amber-600">Para melhor controle financeiro, recomendamos cadastrar suas contas bancárias.</p>
            </div>
          </div>
          <Link href="/dashboard/accounts">
            <Button variant="outline" className="border-amber-300 hover:border-amber-400 hover:bg-amber-100">
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
              {balance >= 0 ? '+' : ''}R$ {formatCurrency(Math.abs(balance))}
            </h2>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
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
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-muted-foreground">
                    Carregando transações...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-muted-foreground">
                    Nenhuma transação encontrada
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b">
                    <td className="px-6 py-4 text-sm">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      {transaction.description}
                      {transaction.recurrenceType !== 'SINGLE' && (
                        <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full">
                          {transaction.recurrenceType === 'INSTALLMENT' 
                            ? `Parcela ${transaction.currentInstallment}/${transaction.installments}` 
                            : 'Recorrente'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex items-center gap-1">
                        <span 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: transaction.category?.color || '#888' }}
                        ></span>
                        {transaction.category?.name || 'Não categorizado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {getAccountName(transaction)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {transaction.paymentMethod === 'CREDIT' ? 'Crédito' : 
                       transaction.paymentMethod === 'DEBIT' ? 'Débito' : 'Dinheiro'}
                    </td>
                    <td className={`px-6 py-4 text-right text-sm font-medium ${
                      transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'INCOME' ? '+' : '-'}R$ {formatCurrency(Math.abs(transaction.amount))}
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
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