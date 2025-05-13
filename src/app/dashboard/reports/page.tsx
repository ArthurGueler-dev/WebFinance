'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Importar componentes
import { AdvancedFilters, FilterOptions } from './components/AdvancedFilters';
import { ExportOptions } from './components/ExportOptions';
import { Insights } from './components/Insights';

// Importar bibliotecas de gráficos
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

// Certificar que o Select está importado corretamente para uso em AdvancedFilters
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Registrar componentes do ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

// Interfaces
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
  availableLimit: number;
}

interface DataSummary {
  currentPeriod: {
    income: number;
    expense: number;
    balance: number;
    topCategory: {
      name: string;
      amount: number;
      percentage: number;
    };
    topExpenseDay?: {
      day: string;
      amount: number;
    };
    categoriesGrowth: {
      [category: string]: number;
    };
  };
  previousPeriod?: {
    income: number;
    expense: number;
    balance: number;
  };
  creditCards?: {
    [cardName: string]: {
      limit: number;
      used: number;
      available: number;
      percentage: number;
    };
  };
}

export default function Reports() {
  // Estado para carregamento
  const [isLoading, setIsLoading] = useState(true);
  
  // Estado para filtros
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: {
      startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1)
        .toISOString()
        .split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      compareWithPrevious: false,
      comparisonType: 'previous-period'
    },
    categories: [],
    transactionTypes: ['INCOME', 'EXPENSE'],
    paymentMethods: ['CASH', 'CREDIT', 'DEBIT', 'FOOD_VOUCHER'],
    accounts: [],
    creditCards: [],
    displayOptions: {
      groupBy: 'month',
      showAs: 'value',
      separateVA: true,
      separateFixedVariable: false
    }
  });

  // Estado para dados
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [dataSummary, setDataSummary] = useState<DataSummary | null>(null);
  
  // Estado para visualização de dados
  const [activeTab, setActiveTab] = useState('overview');

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
  }, []);

  // Buscar dados quando os filtros mudarem
  useEffect(() => {
    if (categories.length > 0) {
      fetchReportData();
    }
  }, [filters]);

  // Função para carregar dados iniciais (categorias, contas, cartões)
  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [categoriesRes, accountsRes, cardsRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/bank-accounts'),
        fetch('/api/credit-cards')
      ]);
      
      if (!categoriesRes.ok || !accountsRes.ok || !cardsRes.ok) {
        throw new Error('Falha ao carregar dados necessários');
      }
      
      const categoriesData = await categoriesRes.json();
      const accountsData = await accountsRes.json();
      const cardsData = await cardsRes.json();
      
      setCategories(categoriesData);
      setBankAccounts(accountsData);
      setCreditCards(cardsData);
      
      // Carregar relatório com os filtros padrão
      await fetchReportData();
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados iniciais.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para buscar dados do relatório com base nos filtros
  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      // Construir URL com parâmetros de filtro
      let url = '/api/transactions';
      const params = new URLSearchParams();
      
      // Adicionar filtros de data
      params.append('startDate', filters.dateRange.startDate);
      params.append('endDate', filters.dateRange.endDate);
      
      // Adicionar outros filtros se selecionados
      if (filters.categories.length > 0) {
        params.append('categories', filters.categories.join(','));
      }
      
      // Adicionar parâmetros à URL se existirem
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Falha ao carregar dados');
      }
      
      const data = await response.json();
      setTransactions(data);
      
      // Processar dados para gráficos e resumos
      processTransactionsData(data);
    } catch (error) {
      console.error('Erro ao buscar dados do relatório:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados do relatório.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Processar os dados das transações para gráficos e resumos
  const processTransactionsData = (transactions: Transaction[]) => {
    // Implementação para processar dados e gerar o resumo
    // Este é um exemplo simplificado, a implementação real seria mais complexa
    
    const currentPeriodData = {
      income: 0,
      expense: 0,
      balance: 0,
      topCategory: {
        name: '',
        amount: 0,
        percentage: 0
      },
      categoriesGrowth: {}
    };
    
    // Processar transações do período atual
    transactions.forEach(transaction => {
      if (transaction.type === 'INCOME') {
        currentPeriodData.income += transaction.amount;
      } else {
        currentPeriodData.expense += Math.abs(transaction.amount);
      }
    });
    
    currentPeriodData.balance = currentPeriodData.income - currentPeriodData.expense;
    
    // Encontrar a categoria de maior gasto
    const categoryExpenses: { [key: string]: number } = {};
    transactions
      .filter(t => t.type === 'EXPENSE')
      .forEach(t => {
        const catName = t.category?.name || 'Sem categoria';
        if (!categoryExpenses[catName]) {
          categoryExpenses[catName] = 0;
        }
        categoryExpenses[catName] += Math.abs(t.amount);
      });
    
    let topCategoryName = '';
    let topCategoryAmount = 0;
    
    Object.entries(categoryExpenses).forEach(([name, amount]) => {
      if (amount > topCategoryAmount) {
        topCategoryName = name;
        topCategoryAmount = amount;
      }
    });
    
    if (topCategoryName) {
      currentPeriodData.topCategory = {
        name: topCategoryName,
        amount: topCategoryAmount,
        percentage: (topCategoryAmount / currentPeriodData.expense) * 100
      };
    }
    
    // Processar informações de cartões de crédito
    const creditCardsInfo: { [cardName: string]: any } = {};
    
    creditCards.forEach(card => {
      const cardTransactions = transactions.filter(
        t => t.creditCard?.id === card.id && t.type === 'EXPENSE'
      );
      
      const totalUsed = cardTransactions.reduce(
        (sum, t) => sum + Math.abs(t.amount), 0
      );
      
      const available = card.limit - totalUsed;
      const percentage = (totalUsed / card.limit) * 100;
      
      creditCardsInfo[card.name] = {
        limit: card.limit,
        used: totalUsed,
        available,
        percentage
      };
    });
    
    // Definir o resumo de dados
    setDataSummary({
      currentPeriod: currentPeriodData,
      creditCards: creditCardsInfo
    });
  };

  // Função para exportar relatório
  const handleExport = async (format: 'pdf' | 'excel' | 'csv', options: any) => {
    // Implementação de exportação de relatório
    console.log(`Exportando relatório em formato ${format} com opções:`, options);
    
    // Simular processamento
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return Promise.resolve();
  };

  // Função para compartilhar relatório
  const handleShare = async (method: 'email' | 'whatsapp', recipient: string, options: any) => {
    // Implementação de compartilhamento de relatório
    console.log(`Compartilhando relatório via ${method} para ${recipient} com opções:`, options);
    
    // Simular processamento
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return Promise.resolve();
  };

  // Função para filtros mudarem
  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  // Função para aplicar filtros
  const applyFilters = () => {
    fetchReportData();
  };

  // Renderização da página
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Relatórios Financeiros</h1>
        <ExportOptions 
          isLoading={isLoading} 
          hasData={transactions.length > 0}
          onExport={handleExport}
          onShare={handleShare}
        />
      </div>

      <AdvancedFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onApplyFilters={applyFilters}
        categories={categories}
        accounts={bankAccounts}
        creditCards={creditCards}
      />

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : transactions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-muted-foreground mb-4">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <h3 className="text-lg font-semibold mb-2">Nenhum dado encontrado</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Não foram encontradas transações para o período e filtros selecionados. 
              Tente ajustar os filtros ou selecionar um período diferente.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Tabs de navegação */}
          <Tabs defaultValue="overview" onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 md:grid-cols-5 lg:w-1/2">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="expenses">Despesas</TabsTrigger>
              <TabsTrigger value="income">Receitas</TabsTrigger>
              <TabsTrigger value="categories">Categorias</TabsTrigger>
              <TabsTrigger value="transactions" className="hidden md:block">Transações</TabsTrigger>
            </TabsList>
            
            <div className="mt-6">
              {/* Seção de Insights */}
              {dataSummary && (
                <Insights 
                  data={dataSummary} 
                  isComparing={filters.dateRange.compareWithPrevious}
                />
              )}
              
              {/* Conteúdo específico das tabs será adicionado aqui */}
              <TabsContent value="overview" className="mt-6 space-y-6">
                {/* Resumo financeiro */}
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Receitas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        R$ {dataSummary?.currentPeriod.income.toFixed(2)}
                      </div>
                      {filters.dateRange.compareWithPrevious && dataSummary?.previousPeriod && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {dataSummary.currentPeriod.income > dataSummary.previousPeriod.income
                            ? `↑ ${(((dataSummary.currentPeriod.income - dataSummary.previousPeriod.income) / dataSummary.previousPeriod.income) * 100).toFixed(1)}% em relação ao período anterior`
                            : `↓ ${(((dataSummary.previousPeriod.income - dataSummary.currentPeriod.income) / dataSummary.previousPeriod.income) * 100).toFixed(1)}% em relação ao período anterior`}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Despesas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        R$ {dataSummary?.currentPeriod.expense.toFixed(2)}
                      </div>
                      {filters.dateRange.compareWithPrevious && dataSummary?.previousPeriod && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {dataSummary.currentPeriod.expense < dataSummary.previousPeriod.expense
                            ? `↓ ${(((dataSummary.previousPeriod.expense - dataSummary.currentPeriod.expense) / dataSummary.previousPeriod.expense) * 100).toFixed(1)}% em relação ao período anterior`
                            : `↑ ${(((dataSummary.currentPeriod.expense - dataSummary.previousPeriod.expense) / dataSummary.previousPeriod.expense) * 100).toFixed(1)}% em relação ao período anterior`}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Saldo</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${dataSummary?.currentPeriod.balance! >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        R$ {dataSummary?.currentPeriod.balance.toFixed(2)}
                      </div>
                      {filters.dateRange.compareWithPrevious && dataSummary?.previousPeriod && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {Math.abs(dataSummary.currentPeriod.balance) > Math.abs(dataSummary.previousPeriod.balance)
                            ? dataSummary.currentPeriod.balance >= 0
                              ? `↑ Melhorou em relação ao período anterior`
                              : `↓ Piorou em relação ao período anterior`
                            : dataSummary.currentPeriod.balance >= 0
                              ? `↓ Reduziu em relação ao período anterior`
                              : `↑ Melhorou em relação ao período anterior`}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Gráficos principais */}
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Receitas vs Despesas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {/* Mock do gráfico - Em produção, preencheria com dados reais */}
                      <div className="h-80 w-full">
                        <Bar 
                          data={{
                            labels: ['Janeiro', 'Fevereiro', 'Março', 'Abril'], // Exemplo
                            datasets: [
                              {
                                label: 'Receitas',
                                data: [4500, 5200, 4800, 5100], // Exemplo
                                backgroundColor: 'rgba(34, 197, 94, 0.7)',
                                borderColor: 'rgba(34, 197, 94, 1)',
                                borderWidth: 1,
                              },
                              {
                                label: 'Despesas',
                                data: [3800, 4200, 4300, 4200], // Exemplo
                                backgroundColor: 'rgba(239, 68, 68, 0.7)',
                                borderColor: 'rgba(239, 68, 68, 1)',
                                borderWidth: 1,
                              }
                            ]
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                              y: {
                                beginAtZero: true
                              }
                            }
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Distribuição de Despesas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {/* Mock do gráfico - Em produção, preencheria com dados reais */}
                      <div className="h-80 w-full flex items-center justify-center">
                        <div className="w-64 h-64">
                          <Pie
                            data={{
                              labels: ['Alimentação', 'Transporte', 'Moradia', 'Lazer', 'Outros'], // Exemplo
                              datasets: [
                                {
                                  data: [25, 15, 35, 10, 15], // Exemplo
                                  backgroundColor: [
                                    'rgba(34, 197, 94, 0.7)',
                                    'rgba(239, 68, 68, 0.7)',
                                    'rgba(59, 130, 246, 0.7)',
                                    'rgba(245, 158, 11, 0.7)',
                                    'rgba(168, 85, 247, 0.7)',
                                  ],
                                  borderColor: [
                                    'rgba(34, 197, 94, 1)',
                                    'rgba(239, 68, 68, 1)',
                                    'rgba(59, 130, 246, 1)',
                                    'rgba(245, 158, 11, 1)',
                                    'rgba(168, 85, 247, 1)',
                                  ],
                                  borderWidth: 1,
                                }
                              ]
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                            }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Cartões de crédito */}
                {dataSummary?.creditCards && Object.keys(dataSummary.creditCards).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Limites de Cartões</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.entries(dataSummary.creditCards).map(([cardName, card]) => (
                          <div key={cardName} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>{cardName}</span>
                              <span>
                                R$ {card.used.toFixed(2)} / R$ {card.limit.toFixed(2)}
                              </span>
                            </div>
                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${
                                  card.percentage > 80 
                                    ? 'bg-red-600' 
                                    : card.percentage > 60 
                                      ? 'bg-amber-500' 
                                      : 'bg-green-600'
                                }`}
                                style={{ width: `${Math.min(100, card.percentage)}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {card.percentage.toFixed(1)}% utilizado • R$ {card.available.toFixed(2)} disponível
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="expenses" className="mt-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Análise de Despesas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Visão detalhada de suas despesas por categoria, método de pagamento e evolução temporal.
                    </p>
                    <div className="text-center py-8">
                      <p>Conteúdo detalhado de despesas será implementado em breve</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="income" className="mt-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Análise de Receitas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Visão detalhada de suas receitas por categoria e evolução temporal.
                    </p>
                    <div className="text-center py-8">
                      <p>Conteúdo detalhado de receitas será implementado em breve</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="categories" className="mt-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Análise por Categorias</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Visão detalhada dos gastos e receitas por categoria.
                    </p>
                    <div className="text-center py-8">
                      <p>Conteúdo detalhado de categorias será implementado em breve</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="transactions" className="mt-6 space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Lista de Transações</CardTitle>
                    <Button variant="outline" size="sm">
                      Exportar CSV
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <p>Listagem detalhada de transações será implementada em breve</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      )}
    </div>
  );
} 