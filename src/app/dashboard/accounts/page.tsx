'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  Cross2Icon,
  ArrowDownIcon,
  ArrowUpIcon
} from '@radix-ui/react-icons';
import BankAccountCard from '@/components/BankAccountCard';
import BankAccountsSummary from '@/components/BankAccountsSummary';
import BankAccountSettings from '@/components/BankAccountSettings';
import BankAccountExtract from '@/components/BankAccountExtract';

interface BankAccount {
  id: string;
  name: string;
  initialBalance: number;
  currentBalance: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export default function Accounts() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showExtractDialog, setShowExtractDialog] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<BankAccount | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'name' | 'currentBalance'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  const [newAccount, setNewAccount] = useState({
    name: '',
    initialBalance: 0,
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async (attempt = 1) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Tentativa ${attempt} de buscar contas bancárias...`);
      const response = await fetch('/api/bank-accounts');
      
      if (!response.ok) {
        if (response.status === 401) {
          console.log('Erro 401: Não autorizado ao buscar contas bancárias');
          // Redirecionar para a dashboard para tentar atualizar a sessão
          window.location.href = '/dashboard';
          throw new Error('Sessão expirada. Redirecionando...');
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Falha ao carregar contas: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Dados de contas recebidos: ${data.length} contas`);
      
      setAccounts(data);
      setRetryCount(0); // Resetar contador de tentativas
    } catch (error) {
      console.error('Erro ao buscar contas:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido ao carregar dados');
      
      // Tentar novamente se for menos que 3 tentativas
      if (attempt < 3) {
        console.log(`Tentando novamente em 2 segundos... (${attempt}/3)`);
        setTimeout(() => {
          setRetryCount(attempt);
          fetchAccounts(attempt + 1);
        }, 2000);
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível carregar suas contas bancárias após várias tentativas.",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/bank-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAccount),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Falha ao criar conta');
      }
      
      const newAccountData = await response.json();
      setAccounts([...accounts, newAccountData]);
      setNewAccount({ name: '', initialBalance: 0 });
      setShowAddForm(false);
      
      toast({
        title: "Conta adicionada com sucesso",
        description: `A conta ${newAccount.name} foi adicionada.`
      });
    } catch (error) {
      console.error('Erro ao adicionar conta:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao adicionar a conta.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEditClick = (account: BankAccount) => {
    setCurrentAccount(account);
    setShowEditDialog(true);
  };
  
  const handleDeleteClick = (account: BankAccount) => {
    setCurrentAccount(account);
    setShowDeleteDialog(true);
  };
  
  const handleSettingsClick = (account: BankAccount) => {
    setCurrentAccount(account);
    setShowSettingsDialog(true);
  };
  
  const handleExtractClick = (account: BankAccount) => {
    setCurrentAccount(account);
    setShowExtractDialog(true);
  };
  
  const handleEditAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAccount) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/bank-accounts/${currentAccount.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: currentAccount.name,
          initialBalance: currentAccount.initialBalance,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Falha ao atualizar conta');
      }
      
      const updatedAccount = await response.json();
      setAccounts(accounts.map(account => 
        account.id === updatedAccount.id ? updatedAccount : account
      ));
      
      setShowEditDialog(false);
      toast({
        title: "Conta atualizada com sucesso",
        description: `A conta ${currentAccount.name} foi atualizada.`
      });
    } catch (error) {
      console.error('Erro ao atualizar conta:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao atualizar a conta.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteAccount = async () => {
    if (!currentAccount) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/bank-accounts/${currentAccount.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Falha ao excluir conta');
      }
      
      setAccounts(accounts.filter(account => account.id !== currentAccount.id));
      setShowDeleteDialog(false);
      
      toast({
        title: "Conta excluída com sucesso",
        description: `A conta ${currentAccount.name} foi excluída.`,
        variant: "destructive"
      });
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao excluir a conta.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const filteredAccounts = accounts.filter(account => 
    account.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const sortedAccounts = [...filteredAccounts].sort((a, b) => {
    if (sortField === 'name') {
      return sortDirection === 'asc' 
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else {
      return sortDirection === 'asc'
        ? a.currentBalance - b.currentBalance
        : b.currentBalance - a.currentBalance;
    }
  });
  
  const toggleSort = (field: 'name' | 'currentBalance') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Contas Bancárias</h1>
        <div className="flex space-x-2">
          {error && retryCount >= 3 && (
            <Button variant="outline" onClick={() => fetchAccounts()} disabled={isLoading} size="sm">
              Tentar Novamente
            </Button>
          )}
          <Button onClick={() => setShowAddForm(!showAddForm)} disabled={isLoading} size="sm">
            <PlusIcon className="h-4 w-4 mr-1" />
            {showAddForm ? 'Cancelar' : 'Nova Conta'}
          </Button>
        </div>
      </div>

      {/* Mensagem de erro */}
      {error && retryCount >= 3 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <p className="font-medium">Erro ao carregar contas bancárias</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Sumário de contas */}
      {!isLoading && accounts.length > 0 && (
        <BankAccountsSummary accounts={accounts} />
      )}

      {/* Formulário de adição */}
      {showAddForm && (
        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Adicionar Nova Conta</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowAddForm(false)}
            >
              <Cross2Icon className="h-4 w-4" />
            </Button>
          </div>
          <form onSubmit={handleAddAccount} className="mt-2 space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium leading-none">
                Nome da Conta
              </label>
              <Input
                id="name"
                value={newAccount.name}
                onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                required
                disabled={isLoading}
                placeholder="Ex: Nubank, Bradesco, etc."
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="initialBalance" className="text-sm font-medium leading-none">
                Saldo Inicial
              </label>
              <Input
                id="initialBalance"
                type="number"
                step="0.01"
                value={newAccount.initialBalance}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    setNewAccount({ ...newAccount, initialBalance: '' as any });
                  } else {
                    const parsed = parseFloat(value);
                    if (!isNaN(parsed)) {
                      setNewAccount({ ...newAccount, initialBalance: parsed });
                    }
                  }
                }}
                required
                disabled={isLoading}
                placeholder="0,00"
                className="w-full"
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Adicionando...' : 'Adicionar Conta'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Barra de filtro e ordenação */}
      {!isLoading && accounts.length > 0 && (
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
          <div className="relative w-full md:w-64">
            <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar contas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Ordenar por:</span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 gap-1"
              onClick={() => toggleSort('name')}
            >
              Nome
              {sortField === 'name' && (
                sortDirection === 'asc' ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 gap-1"
              onClick={() => toggleSort('currentBalance')}
            >
              Saldo
              {sortField === 'currentBalance' && (
                sortDirection === 'asc' ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Lista de contas */}
      {isLoading && accounts.length === 0 ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : accounts.length === 0 ? (
        <div className="border rounded-lg p-12 text-center bg-muted/10">
          <h3 className="font-medium text-lg mb-2">Você ainda não possui contas bancárias</h3>
          <p className="text-muted-foreground mb-6">
            Adicione sua primeira conta para começar a controlar suas finanças.
          </p>
          <Button onClick={() => setShowAddForm(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Adicionar Primeira Conta
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedAccounts.map((account) => (
            <BankAccountCard
              key={account.id}
              account={account}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              onExtract={handleExtractClick}
              onSettings={handleSettingsClick}
            />
          ))}
        </div>
      )}
      
      {/* Diálogo de Edição */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Conta Bancária</DialogTitle>
          </DialogHeader>
          {currentAccount && (
            <form onSubmit={handleEditAccount} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="edit-name" className="text-sm font-medium leading-none">
                  Nome da Conta
                </label>
                <Input
                  id="edit-name"
                  value={currentAccount.name}
                  onChange={(e) => setCurrentAccount({ ...currentAccount, name: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-initialBalance" className="text-sm font-medium leading-none">
                  Saldo Inicial
                </label>
                <Input
                  id="edit-initialBalance"
                  type="number"
                  step="0.01"
                  value={currentAccount.initialBalance}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setCurrentAccount({ 
                        ...currentAccount, 
                        initialBalance: '' as any 
                      });
                    } else {
                      const parsedValue = parseFloat(value);
                      if (!isNaN(parsedValue)) {
                        const diff = parsedValue - currentAccount.initialBalance;
                        setCurrentAccount({ 
                          ...currentAccount, 
                          initialBalance: parsedValue,
                          currentBalance: currentAccount.currentBalance + diff
                        });
                      }
                    }
                  }}
                  required
                  disabled={isLoading}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)} disabled={isLoading}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de Exclusão */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir Conta Bancária</DialogTitle>
          </DialogHeader>
          {currentAccount && (
            <div className="space-y-4">
              <p>
                Tem certeza que deseja excluir a conta <strong>{currentAccount.name}</strong>?
                Esta ação não pode ser desfeita.
              </p>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isLoading}>
                  Cancelar
                </Button>
                <Button type="button" variant="destructive" onClick={handleDeleteAccount} disabled={isLoading}>
                  {isLoading ? 'Excluindo...' : 'Excluir'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Modais de Configurações e Extrato */}
      <BankAccountSettings 
        open={showSettingsDialog} 
        onOpenChange={setShowSettingsDialog} 
        account={currentAccount} 
      />
      
      <BankAccountExtract 
        open={showExtractDialog} 
        onOpenChange={setShowExtractDialog} 
        account={currentAccount} 
      />
    </div>
  );
} 