'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import { 
  Search, 
  Plus, 
  ArrowUp, 
  ArrowDown,
  CreditCard as CreditCardIcon
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog';
import CreditCardCard from '@/components/CreditCardCard';
import CreditCardsSummary from '@/components/CreditCardsSummary';
import CreditCardSettings from '@/components/CreditCardSettings';

interface CreditCardData {
  id: string;
  name: string;
  limit: number;
  dueDay: number;
  closingDay: number;
  cardType: 'CREDIT' | 'DEBIT' | 'FOOD_VOUCHER';
  availableLimit: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
  color?: string;
}

export default function CreditCards() {
  const [isLoading, setIsLoading] = useState(true);
  const [creditCards, setCreditCards] = useState<CreditCardData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  const [currentCard, setCurrentCard] = useState<CreditCardData | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showTransactionsDialog, setShowTransactionsDialog] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'name' | 'availableLimit'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/credit-cards');
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/dashboard');
          throw new Error('Sessão expirada. Redirecionando...');
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Falha ao carregar cartões: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Prepara os dados dos cartões
      const preparedCards = data.map((card: CreditCardData) => {
        // Calcula o limite disponível (em um app real, isso viria da API)
        if (!card.availableLimit && card.availableLimit !== 0) {
          card.availableLimit = card.limit; // Valor padrão se não estiver definido
        }
        return card;
      });
      
      setCreditCards(preparedCards);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido ao carregar dados');
      
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os cartões de crédito.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const updateCreditCardSettings = async (cardId: string, settings: any) => {
    try {
      const response = await fetch(`/api/credit-cards/${cardId}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });
      
      if (!response.ok) {
        throw new Error("Falha ao atualizar configurações");
      }
      
      // Atualiza o estado com os cartões atualizados
      setCreditCards(prev => 
        prev.map(card => 
          card.id === cardId ? { ...card, ...settings } : card
        )
      );
      
      return Promise.resolve();
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      return Promise.reject(error);
    }
  };
  
  const handleShowSettings = (card: CreditCardData) => {
    setCurrentCard(card);
    setShowSettingsDialog(true);
  };
  
  const handleShowTransactions = (card: CreditCardData) => {
    setCurrentCard(card);
    setShowTransactionsDialog(true);
  };
  
  const handleEditCard = (card: CreditCardData) => {
    router.push(`/dashboard/credit-cards/${card.id}`);
  };
  
  const handleDeleteCard = (card: CreditCardData) => {
    setCurrentCard(card);
    setShowDeleteDialog(true);
  };
  
  const confirmDeleteCard = async () => {
    if (!currentCard) return;
    
    try {
      const response = await fetch(`/api/credit-cards/${currentCard.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error("Falha ao excluir cartão");
      }
      
      setCreditCards(prev => prev.filter(card => card.id !== currentCard.id));
      setShowDeleteDialog(false);
      
      toast({
        title: "Cartão excluído",
        description: `O cartão ${currentCard.name} foi excluído com sucesso.`
      });
    } catch (error) {
      console.error('Erro ao excluir cartão:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao excluir o cartão.",
        variant: "destructive"
      });
    }
  };
  
  const filteredCards = creditCards.filter(card => 
    card.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const sortedCards = [...filteredCards].sort((a, b) => {
    if (sortField === 'name') {
      return sortDirection === 'asc'
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else {
      return sortDirection === 'asc'
        ? a.availableLimit - b.availableLimit
        : b.availableLimit - a.availableLimit;
    }
  });
  
  const toggleSort = (field: 'name' | 'availableLimit') => {
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
        <h1 className="text-2xl font-bold tracking-tight">Cartões de Crédito</h1>
        <Button asChild>
          <Link href="/dashboard/credit-cards/new">
            <Plus className="h-4 w-4 mr-2" />
            Novo Cartão
          </Link>
        </Button>
      </div>

      {/* Sumário */}
      {!isLoading && creditCards.length > 0 && (
        <CreditCardsSummary cards={creditCards} />
      )}

      {/* Mensagem de erro */}
      {error && (
        <div className="p-4 border rounded-md bg-red-50 text-red-800">
          <p className="font-medium">Erro ao carregar cartões</p>
          <p className="text-sm mt-1">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => fetchCards()}
          >
            Tentar Novamente
          </Button>
        </div>
      )}
      
      {/* Barra de filtro e pesquisa */}
      {!isLoading && creditCards.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cartões..."
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
                sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 gap-1"
              onClick={() => toggleSort('availableLimit')}
            >
              Limite Disponível
              {sortField === 'availableLimit' && (
                sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Lista de cartões */}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : creditCards.length === 0 ? (
        <div className="p-8 text-center border rounded-lg bg-muted/20">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <CreditCardIcon className="h-6 w-6 text-primary" />
            </div>
          </div>
          <h3 className="text-lg font-medium mb-2">Você ainda não possui cartões de crédito</h3>
          <p className="text-muted-foreground mb-4">
            Adicione seu primeiro cartão para controlar seus gastos.
          </p>
          <Button asChild>
            <Link href="/dashboard/credit-cards/new">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Cartão
            </Link>
          </Button>
        </div>
      ) : sortedCards.length === 0 ? (
        <div className="p-6 text-center border rounded-lg">
          <p className="text-muted-foreground">
            Nenhum cartão encontrado com o termo "{searchTerm}".
          </p>
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-2"
            onClick={() => setSearchTerm('')}
          >
            Limpar Busca
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedCards.map((card) => (
            <CreditCardCard
              key={card.id}
              card={card}
              onEdit={handleEditCard}
              onDelete={handleDeleteCard}
              onTransactions={handleShowTransactions}
              onSettings={handleShowSettings}
            />
          ))}
        </div>
      )}
      
      {/* Diálogo de exclusão */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir Cartão</DialogTitle>
          </DialogHeader>
          
          {currentCard && (
            <>
              <div className="space-y-2">
                <p>
                  Tem certeza que deseja excluir o cartão <strong>{currentCard.name}</strong>?
                </p>
                <p className="text-sm text-muted-foreground">
                  Esta ação não pode ser desfeita. Todas as transações associadas a este cartão serão desvinculadas.
                </p>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={confirmDeleteCard}>
                  Excluir Cartão
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Dialog de configurações */}
      <CreditCardSettings
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
        card={currentCard}
        onUpdateSettings={updateCreditCardSettings}
      />
      
      {/* Dialog de transações (seria implementado em outra tela) */}
      <Dialog open={showTransactionsDialog} onOpenChange={setShowTransactionsDialog}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Transações do Cartão</DialogTitle>
          </DialogHeader>
          
          <div className="min-h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">
              Funcionalidade de visualização de transações em desenvolvimento.
            </p>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowTransactionsDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 