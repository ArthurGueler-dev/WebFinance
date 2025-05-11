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
  const [currentAccount, setCurrentAccount] = useState<BankAccount | null>(null);
  
  const [newAccount, setNewAccount] = useState({
    name: '',
    initialBalance: 0,
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/bank-accounts');
      if (!response.ok) {
        throw new Error('Falha ao carregar contas bancárias');
      }
      const data = await response.json();
      setAccounts(data);
    } catch (error) {
      console.error('Erro ao buscar contas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar suas contas bancárias.",
        variant: "destructive"
      });
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Contas Bancárias</h1>
        <Button onClick={() => setShowAddForm(!showAddForm)} disabled={isLoading}>
          {showAddForm ? 'Cancelar' : 'Adicionar Conta'}
        </Button>
      </div>

      {showAddForm && (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-medium">Adicionar Nova Conta</h3>
          <form onSubmit={handleAddAccount} className="mt-4 space-y-4">
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

      {isLoading && accounts.length === 0 ? (
        <div className="text-center py-10">
          <p>Carregando contas...</p>
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-10">
          <p>Você ainda não possui contas bancárias.</p>
          <p className="text-muted-foreground">Adicione sua primeira conta para começar a controlar suas finanças.</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
                    Nome da Conta
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-muted-foreground">
                    Saldo Inicial
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-muted-foreground">
                    Saldo Atual
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-muted-foreground">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr key={account.id} className="border-b">
                    <td className="px-6 py-4 text-sm font-medium">{account.name}</td>
                    <td className="px-6 py-4 text-right text-sm">
                      R$ {formatCurrency(account.initialBalance)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      R$ {formatCurrency(account.currentBalance)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mr-2"
                        onClick={() => handleEditClick(account)}
                        disabled={isLoading}
                      >
                        Editar
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDeleteClick(account)}
                        disabled={isLoading}
                      >
                        Excluir
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Diálogo de Edição */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
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
        <DialogContent>
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
    </div>
  );
} 