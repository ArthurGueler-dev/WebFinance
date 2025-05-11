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
  paymentMethod: 'CASH' | 'CREDIT' | 'DEBIT';
  category: {
    name: string;
    color: string;
  };
}

export default function CreditCards() {
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showTransactionsDialog, setShowTransactionsDialog] = useState(false);
  const [currentCard, setCurrentCard] = useState<CreditCard | null>(null);
  const [cardTransactions, setCardTransactions] = useState<Transaction[]>([]);
  
  const [newCard, setNewCard] = useState({
    name: '',
    limit: 0,
    dueDay: 1,
    closingDay: 1,
  });

  useEffect(() => {
    fetchCreditCards();
  }, []);

  const fetchCreditCards = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/credit-cards');
      if (!response.ok) {
        throw new Error('Falha ao carregar cartões de crédito');
      }
      const data = await response.json();
      
      // Para cada cartão, calcular o limite disponível
      const enhancedCards = await Promise.all(
        data.map(async (card: CreditCard) => {
          // Buscar transações de despesa do cartão
          const transactionsResponse = await fetch(`/api/transactions?creditCardId=${card.id}&type=EXPENSE`);
          
          if (transactionsResponse.ok) {
            const transactions = await transactionsResponse.json();
            
            // Calcular total de despesas
            const expensesSum = transactions.reduce(
              (sum: number, t: any) => sum + Math.abs(t.amount),
              0
            );
            
            // Calcular limite disponível
            const availableLimit = Math.max(0, card.limit - expensesSum);
            
            return {
              ...card,
              availableLimit
            };
          }
          
          // Se falhou ao buscar transações, retorna o cartão com limite disponível igual ao limite total
          return {
            ...card,
            availableLimit: card.limit
          };
        })
      );
      
      setCreditCards(enhancedCards);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os cartões.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/credit-cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCard),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Falha ao criar cartão');
      }
      
      const newCardData = await response.json();
      setCreditCards([...creditCards, newCardData]);
      setNewCard({ name: '', limit: 0, dueDay: 1, closingDay: 1 });
      setShowAddForm(false);
      
      toast({
        title: "Cartão adicionado com sucesso",
        description: `O cartão ${newCard.name} foi adicionado.`
      });
    } catch (error) {
      console.error('Erro ao adicionar cartão:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao adicionar o cartão.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEditClick = (card: CreditCard) => {
    setCurrentCard(card);
    setShowEditDialog(true);
  };
  
  const handleDeleteClick = (card: CreditCard) => {
    setCurrentCard(card);
    setShowDeleteDialog(true);
  };
  
  const handleEditCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCard) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/credit-cards/${currentCard.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: currentCard.name,
          limit: currentCard.limit,
          dueDay: currentCard.dueDay,
          closingDay: currentCard.closingDay,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Falha ao atualizar cartão');
      }
      
      const updatedCard = await response.json();
      setCreditCards(creditCards.map(card => 
        card.id === updatedCard.id ? updatedCard : card
      ));
      
      setShowEditDialog(false);
      toast({
        title: "Cartão atualizado com sucesso",
        description: `O cartão ${currentCard.name} foi atualizado.`
      });
    } catch (error) {
      console.error('Erro ao atualizar cartão:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao atualizar o cartão.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteCard = async () => {
    if (!currentCard) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/credit-cards/${currentCard.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Falha ao excluir cartão');
      }
      
      setCreditCards(creditCards.filter(card => card.id !== currentCard.id));
      setShowDeleteDialog(false);
      
      toast({
        title: "Cartão excluído com sucesso",
        description: `O cartão ${currentCard.name} foi excluído.`,
        variant: "destructive"
      });
    } catch (error) {
      console.error('Erro ao excluir cartão:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao excluir o cartão.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewTransactions = async (card: CreditCard) => {
    setCurrentCard(card);
    setIsLoading(true);
    
    try {
      // Buscar transações do mês atual para este cartão
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const formattedFirstDay = firstDay.toISOString().split('T')[0];
      const formattedLastDay = lastDay.toISOString().split('T')[0];
      
      const response = await fetch(
        `/api/transactions?creditCardId=${card.id}&startDate=${formattedFirstDay}&endDate=${formattedLastDay}`
      );
      
      if (!response.ok) {
        throw new Error('Falha ao carregar transações do cartão');
      }
      
      const data = await response.json();
      setCardTransactions(data);
      setShowTransactionsDialog(true);
    } catch (error) {
      console.error('Erro ao buscar transações do cartão:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as transações deste cartão.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualUpdateLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCard) return;
    
    setIsLoading(true);
    try {
      // Fazer a requisição para atualizar o cartão com o novo limite disponível
      const response = await fetch(`/api/credit-cards/${currentCard.id}/update-limit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          availableLimit: currentCard.availableLimit,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Falha ao atualizar limite disponível');
      }
      
      const updatedCard = await response.json();
      
      // Atualizar o estado dos cartões
      setCreditCards(creditCards.map(card => 
        card.id === updatedCard.id ? updatedCard : card
      ));
      
      setShowTransactionsDialog(false);
      toast({
        title: "Limite atualizado com sucesso",
        description: `O limite disponível do cartão ${currentCard.name} foi atualizado.`
      });
    } catch (error) {
      console.error('Erro ao atualizar limite:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao atualizar o limite disponível.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Cartões de Crédito</h1>
        <Button onClick={() => setShowAddForm(!showAddForm)} disabled={isLoading}>
          {showAddForm ? 'Cancelar' : 'Adicionar Cartão'}
        </Button>
      </div>

      {showAddForm && (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-medium">Adicionar Novo Cartão</h3>
          <form onSubmit={handleAddCard} className="mt-4 space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium leading-none">
                Nome do Cartão
              </label>
              <Input
                id="name"
                value={newCard.name}
                onChange={(e) => setNewCard({ ...newCard, name: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="limit" className="text-sm font-medium leading-none">
                Limite de Crédito
              </label>
              <Input
                id="limit"
                type="number"
                step="0.01"
                value={newCard.limit}
                onChange={(e) =>
                  setNewCard({ ...newCard, limit: parseFloat(e.target.value) || 0 })
                }
                required
                disabled={isLoading}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="dueDay" className="text-sm font-medium leading-none">
                  Dia de Vencimento
                </label>
                <Input
                  id="dueDay"
                  type="number"
                  min="1"
                  max="31"
                  value={newCard.dueDay}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setNewCard({ ...newCard, dueDay: '' as any });
                    } else {
                      const parsed = parseInt(value);
                      if (!isNaN(parsed) && parsed >= 1 && parsed <= 31) {
                        setNewCard({ ...newCard, dueDay: parsed });
                      }
                    }
                  }}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="closingDay" className="text-sm font-medium leading-none">
                  Dia de Fechamento
                </label>
                <Input
                  id="closingDay"
                  type="number"
                  min="1"
                  max="31"
                  value={newCard.closingDay}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setNewCard({ ...newCard, closingDay: '' as any });
                    } else {
                      const parsed = parseInt(value);
                      if (!isNaN(parsed) && parsed >= 1 && parsed <= 31) {
                        setNewCard({ ...newCard, closingDay: parsed });
                      }
                    }
                  }}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Adicionando...' : 'Adicionar Cartão'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {isLoading && creditCards.length === 0 ? (
        <div className="text-center py-10">
          <p>Carregando cartões...</p>
        </div>
      ) : creditCards.length === 0 ? (
        <div className="text-center py-10">
          <p>Você ainda não possui cartões de crédito.</p>
          <p className="text-muted-foreground">Adicione seu primeiro cartão para começar a controlar seus gastos.</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
                    Nome do Cartão
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-muted-foreground">
                    Limite
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-muted-foreground">
                    Disponível
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-muted-foreground">
                    Vencimento
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-muted-foreground">
                    Fechamento
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-muted-foreground">
                    Utilização
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-muted-foreground">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {creditCards.map((card) => {
                  const usagePercentage = ((card.limit - card.availableLimit) / card.limit) * 100;
                  
                  return (
                    <tr key={card.id} className="border-b">
                      <td className="px-6 py-4 text-sm font-medium">{card.name}</td>
                      <td className="px-6 py-4 text-right text-sm">
                        <div>
                          <div>Total: {formatCurrency(card.limit)}</div>
                          <div className="text-green-600 dark:text-green-400">
                            Disponível: {formatCurrency(card.availableLimit)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-full rounded-full bg-muted">
                            <div
                              className={`h-2 rounded-full ${
                                usagePercentage > 75 ? 'bg-red-500' : 'bg-primary'
                              }`}
                              style={{ width: `${usagePercentage}%` }}
                            ></div>
                          </div>
                          <span className="w-10 text-xs">{Math.round(usagePercentage)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-sm">
                        {card.dueDay}
                      </td>
                      <td className="px-6 py-4 text-center text-sm">
                        {card.closingDay}
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mr-2" 
                          onClick={() => handleViewTransactions(card)}
                          disabled={isLoading}
                        >
                          Gastos
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mr-2" 
                          onClick={() => handleEditClick(card)}
                          disabled={isLoading}
                        >
                          Editar
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleDeleteClick(card)}
                          disabled={isLoading}
                        >
                          Excluir
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Diálogo de Edição */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Cartão de Crédito</DialogTitle>
          </DialogHeader>
          {currentCard && (
            <form onSubmit={handleEditCard} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="edit-name" className="text-sm font-medium leading-none">
                  Nome do Cartão
                </label>
                <Input
                  id="edit-name"
                  value={currentCard.name}
                  onChange={(e) => setCurrentCard({ ...currentCard, name: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-limit" className="text-sm font-medium leading-none">
                  Limite de Crédito
                </label>
                <Input
                  id="edit-limit"
                  type="number"
                  step="0.01"
                  value={currentCard.limit}
                  onChange={(e) => {
                    const newLimit = parseFloat(e.target.value) || 0;
                    const used = currentCard.limit - currentCard.availableLimit;
                    setCurrentCard({ 
                      ...currentCard, 
                      limit: newLimit,
                      availableLimit: Math.max(0, newLimit - used)
                    });
                  }}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="edit-dueDay" className="text-sm font-medium leading-none">
                    Dia de Vencimento
                  </label>
                  <Input
                    id="edit-dueDay"
                    type="number"
                    min="1"
                    max="31"
                    value={currentCard.dueDay}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        setCurrentCard({ ...currentCard, dueDay: '' as any });
                      } else {
                        const parsed = parseInt(value);
                        if (!isNaN(parsed) && parsed >= 1 && parsed <= 31) {
                          setCurrentCard({ ...currentCard, dueDay: parsed });
                        }
                      }
                    }}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-closingDay" className="text-sm font-medium leading-none">
                    Dia de Fechamento
                  </label>
                  <Input
                    id="edit-closingDay"
                    type="number"
                    min="1"
                    max="31"
                    value={currentCard.closingDay}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        setCurrentCard({ ...currentCard, closingDay: '' as any });
                      } else {
                        const parsed = parseInt(value);
                        if (!isNaN(parsed) && parsed >= 1 && parsed <= 31) {
                          setCurrentCard({ ...currentCard, closingDay: parsed });
                        }
                      }
                    }}
                    required
                    disabled={isLoading}
                  />
                </div>
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
            <DialogTitle>Excluir Cartão de Crédito</DialogTitle>
          </DialogHeader>
          {currentCard && (
            <div className="space-y-4">
              <p>
                Tem certeza que deseja excluir o cartão <strong>{currentCard.name}</strong>?
                Esta ação não pode ser desfeita.
              </p>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isLoading}>
                  Cancelar
                </Button>
                <Button type="button" variant="destructive" onClick={handleDeleteCard} disabled={isLoading}>
                  {isLoading ? 'Excluindo...' : 'Excluir'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo de Transações */}
      <Dialog open={showTransactionsDialog} onOpenChange={setShowTransactionsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Gastos do Cartão: {currentCard?.name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Resumo de limite e uso */}
            <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Limite Total</p>
                <p className="text-lg font-bold">R$ {currentCard ? formatCurrency(currentCard.limit) : 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Limite Usado</p>
                <p className="text-lg font-bold text-red-600">
                  R$ {currentCard ? formatCurrency(currentCard.limit - currentCard.availableLimit) : 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Limite Disponível</p>
                <p className="text-lg font-bold text-green-600">
                  R$ {currentCard ? formatCurrency(currentCard.availableLimit) : 0}
                </p>
              </div>
            </div>
            
            {/* Formulário para atualização manual do limite */}
            <div className="rounded-lg border p-4">
              <h4 className="text-md font-medium mb-2">Atualizar Limite Disponível</h4>
              <form onSubmit={handleManualUpdateLimit} className="flex items-end gap-4">
                <div className="flex-1 space-y-2">
                  <label htmlFor="availableLimit" className="text-sm font-medium leading-none">
                    Valor Disponível
                  </label>
                  <Input
                    id="availableLimit"
                    type="number"
                    step="0.01"
                    value={currentCard?.availableLimit || 0}
                    onChange={(e) => currentCard && setCurrentCard({
                      ...currentCard,
                      availableLimit: Math.min(currentCard.limit, parseFloat(e.target.value) || 0)
                    })}
                    max={currentCard?.limit}
                    required
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Atualizando...' : 'Atualizar Limite'}
                </Button>
              </form>
              <p className="text-xs text-muted-foreground mt-1">
                Use esta opção para ajustar manualmente o limite disponível, caso existam compras não registradas.
              </p>
            </div>
            
            {/* Lista de transações */}
            <div className="border rounded-lg">
              <h4 className="text-md font-medium p-4 border-b">Transações Recentes</h4>
              <div className="overflow-x-auto">
                {cardTransactions.length === 0 ? (
                  <p className="p-4 text-center text-muted-foreground">
                    Nenhuma transação encontrada para este cartão no mês atual.
                  </p>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Data</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Descrição</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Categoria</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-muted-foreground">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cardTransactions.map((transaction) => (
                        <tr key={transaction.id} className="border-b">
                          <td className="px-4 py-2 text-sm">{formatDate(transaction.date)}</td>
                          <td className="px-4 py-2 text-sm font-medium">{transaction.description}</td>
                          <td className="px-4 py-2 text-sm">
                            <span className="inline-flex items-center gap-1">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: transaction.category?.color || '#888' }}
                              ></span>
                              {transaction.category?.name || 'Não categorizado'}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right text-sm font-medium text-red-600">
                            -R$ {formatCurrency(Math.abs(transaction.amount))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 