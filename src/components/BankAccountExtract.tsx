"use client";

import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';
import { DownloadIcon, CalendarIcon } from '@radix-ui/react-icons';
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

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: 'INCOME' | 'EXPENSE';
}

interface BankAccountExtractProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: BankAccount | null;
}

export default function BankAccountExtract({
  open,
  onOpenChange,
  account
}: BankAccountExtractProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(1)).toISOString().split('T')[0], // Primeiro dia do mês atual
    end: new Date().toISOString().split('T')[0], // Hoje
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && account) {
      fetchTransactions();
    }
  }, [open, account]);
  
  const fetchTransactions = async () => {
    if (!account) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Tentar buscar as transações reais da API
      const response = await fetch(`/api/transactions?bankAccountId=${account.id}`);
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar transações: ${response.status}`);
      }
      
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
      setError('Não foi possível carregar as transações. Usando dados simulados.');
      
      // Fallback para dados simulados em caso de erro
      setTransactions(generateMockTransactions());
      
      toast({
        title: "Aviso",
        description: "Usando dados de exemplo. Não foi possível buscar as transações reais.",
        variant: "default"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Mock para gerar transações de exemplo
  const generateMockTransactions = () => {
    if (!account) return [];
    
    const result: Transaction[] = [];
    const now = new Date();
    const numberOfTransactions = 15 + Math.floor(Math.random() * 10);
    
    for (let i = 0; i < numberOfTransactions; i++) {
      const days = Math.floor(Math.random() * 30);
      const transactionDate = new Date(now);
      transactionDate.setDate(transactionDate.getDate() - days);
      
      const isIncome = Math.random() > 0.6; // 40% de chance de ser receita
      const amount = isIncome ? 
        100 + Math.random() * 2000 : 
        -(50 + Math.random() * 500);
      
      const descriptions = isIncome ? 
        ['Salário', 'Reembolso', 'Transferência', 'PIX Recebido', 'Rendimentos', 'Devolução'] :
        ['Supermercado', 'Restaurante', 'Streaming', 'Combustível', 'Farmácia', 'Transporte', 'Serviços'];
      
      const description = descriptions[Math.floor(Math.random() * descriptions.length)];
      
      result.push({
        id: `tx-${i}-${Date.now()}`,
        description: `${description} ${Math.floor(Math.random() * 100)}`,
        amount,
        date: transactionDate.toISOString(),
        type: isIncome ? 'INCOME' : 'EXPENSE'
      });
    }
    
    // Ordenar por data (mais recente primeiro)
    return result.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };
  
  const formatDate = (isoDate: string) => {
    return new Date(isoDate).toLocaleDateString('pt-BR');
  };
  
  const filteredTransactions = transactions.filter(tx => {
    // Filtra por texto
    const textMatch = tx.description.toLowerCase().includes(filter.toLowerCase());
    
    // Filtra por data
    const txDate = new Date(tx.date);
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    endDate.setHours(23, 59, 59); // Final do dia
    
    const dateMatch = txDate >= startDate && txDate <= endDate;
    
    return textMatch && dateMatch;
  });
  
  const exportToCSV = () => {
    if (!account) return;
    
    const headers = ['Data', 'Descrição', 'Tipo', 'Valor'];
    
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(tx => [
        formatDate(tx.date),
        `"${tx.description}"`,
        tx.type === 'INCOME' ? 'Receita' : 'Despesa',
        tx.amount.toFixed(2).replace('.', ',')
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `extrato_${account.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const getBalance = () => {
    if (!account) return 0;
    
    // Calcula o saldo: saldo inicial + soma das transações
    return account.initialBalance + filteredTransactions.reduce(
      (total, tx) => total + tx.amount, 0
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center justify-between">
            <span>Extrato - {account?.name}</span>
            <Button variant="outline" size="sm" className="ml-auto" onClick={exportToCSV}>
              <DownloadIcon className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </DialogTitle>
        </DialogHeader>

        {account && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 justify-between">
              <div className="flex-1">
                <Input
                  placeholder="Filtrar transações..."
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex items-center gap-2">
                <CalendarIcon className="text-muted-foreground" />
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={e => setDateRange({...dateRange, start: e.target.value})}
                  className="w-32"
                />
                <span className="text-muted-foreground">a</span>
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={e => setDateRange({...dateRange, end: e.target.value})}
                  className="w-32"
                />
              </div>
            </div>
            
            <div className="flex justify-between p-4 bg-muted/30 rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground">Saldo Inicial</div>
                <div className="font-medium">R$ {formatCurrency(account.initialBalance)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Entradas</div>
                <div className="font-medium text-green-600">
                  + R$ {formatCurrency(filteredTransactions.filter(tx => tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0))}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Saídas</div>
                <div className="font-medium text-red-600">
                  - R$ {formatCurrency(Math.abs(filteredTransactions.filter(tx => tx.amount < 0).reduce((sum, tx) => sum + tx.amount, 0)))}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Saldo Final</div>
                <div className={`font-bold ${getBalance() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {formatCurrency(getBalance())}
                </div>
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : error ? (
              <div className="text-center p-4 border rounded-md bg-yellow-50">
                <p className="text-yellow-800">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={fetchTransactions}
                >
                  Tentar Novamente
                </Button>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                <p>Nenhuma transação encontrada para o período selecionado.</p>
                <p className="text-sm">Tente ajustar os filtros ou período.</p>
              </div>
            ) : (
              <div className="overflow-y-auto max-h-80 border rounded-lg">
                <table className="w-full">
                  <thead className="bg-muted/30 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Data</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Descrição</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map(tx => (
                      <tr key={tx.id} className="border-b hover:bg-muted/20">
                        <td className="px-4 py-2 text-xs">{formatDate(tx.date)}</td>
                        <td className="px-4 py-2 text-sm">{tx.description}</td>
                        <td className={`px-4 py-2 text-right font-medium ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.amount >= 0 ? '+' : ''} R$ {formatCurrency(Math.abs(tx.amount))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        
        <DialogFooter className="pt-2">
          <Button
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 