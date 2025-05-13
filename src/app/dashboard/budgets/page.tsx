'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { formatCurrency } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import { 
  Plus, 
  AlertCircle,
  Edit, 
  CheckCircle,
  PieChart, 
  BarChart,
  AlertTriangle,
  DollarSign,
  ArrowUpCircle,
  ArrowDownCircle
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
  type: 'INCOME' | 'EXPENSE';
  createdAt: string;
}

interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  spentAmount: number;
  month: number;
  year: number;
  userId: string;
  alertThreshold: number;
  createdAt: string;
  updatedAt: string;
  category: Category;
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: 'INCOME' | 'EXPENSE';
  paymentMethod: string;
  categoryId: string;
  category: Category;
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewBudgetDialog, setShowNewBudgetDialog] = useState(false);
  const [showEditBudgetDialog, setShowEditBudgetDialog] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentView, setCurrentView] = useState<'list' | 'chart'>('list');
  const router = useRouter();
  
  const [newBudget, setNewBudget] = useState({
    categoryId: '',
    amount: '',
    alertThreshold: 80, // 80% como padrão
  });
  
  useEffect(() => {
    fetchData();
  }, [currentMonth, currentYear]);
  
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Carregar categorias
      const categoriesResponse = await fetch('/api/categories');
      if (!categoriesResponse.ok) {
        throw new Error(`Erro ao carregar categorias: ${categoriesResponse.status}`);
      }
      const categoriesData = await categoriesResponse.json();
      setCategories(categoriesData.filter((cat: Category) => cat.type === 'EXPENSE'));
      
      // Carregar orçamentos
      const budgetsResponse = await fetch(`/api/budgets?month=${currentMonth}&year=${currentYear}`);
      if (!budgetsResponse.ok) {
        throw new Error(`Erro ao carregar orçamentos: ${budgetsResponse.status}`);
      }
      const budgetsData = await budgetsResponse.json();
      setBudgets(budgetsData);
      
      // Carregar transações do mês
      const startDate = new Date(currentYear, currentMonth - 1, 1);
      const endDate = new Date(currentYear, currentMonth, 0);
      
      const transactionsResponse = await fetch(
        `/api/transactions?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
      if (!transactionsResponse.ok) {
        throw new Error(`Erro ao carregar transações: ${transactionsResponse.status}`);
      }
      const transactionsData = await transactionsResponse.json();
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados de orçamento.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const createBudget = async () => {
    try {
      if (!newBudget.categoryId || !newBudget.amount) {
        toast({
          title: 'Campos obrigatórios',
          description: 'Preencha todos os campos obrigatórios.',
          variant: 'destructive'
        });
        return;
      }
      
      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          categoryId: newBudget.categoryId,
          amount: parseFloat(newBudget.amount),
          alertThreshold: newBudget.alertThreshold,
          month: currentMonth,
          year: currentYear
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error === 'DUPLICATE_BUDGET') {
          toast({
            title: 'Orçamento já existe',
            description: 'Já existe um orçamento para esta categoria neste mês.',
            variant: 'destructive'
          });
          return;
        }
        throw new Error(`Erro ao criar orçamento: ${response.status}`);
      }
      
      await fetchData();
      setShowNewBudgetDialog(false);
      setNewBudget({
        categoryId: '',
        amount: '',
        alertThreshold: 80
      });
      
      toast({
        title: 'Orçamento criado',
        description: 'O orçamento foi criado com sucesso!'
      });
    } catch (error) {
      console.error('Erro ao criar orçamento:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao criar o orçamento.',
        variant: 'destructive'
      });
    }
  };
  
  const updateBudget = async () => {
    if (!selectedBudget) return;
    
    try {
      const response = await fetch(`/api/budgets/${selectedBudget.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: selectedBudget.amount,
          alertThreshold: selectedBudget.alertThreshold
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao atualizar orçamento: ${response.status}`);
      }
      
      await fetchData();
      setShowEditBudgetDialog(false);
      
      toast({
        title: 'Orçamento atualizado',
        description: 'As alterações foram salvas com sucesso!'
      });
    } catch (error) {
      console.error('Erro ao atualizar orçamento:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao atualizar o orçamento.',
        variant: 'destructive'
      });
    }
  };
  
  const deleteBudget = async (budgetId: string) => {
    try {
      const response = await fetch(`/api/budgets/${budgetId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao excluir orçamento: ${response.status}`);
      }
      
      setBudgets(budgets.filter(budget => budget.id !== budgetId));
      
      toast({
        title: 'Orçamento excluído',
        description: 'O orçamento foi excluído com sucesso.'
      });
    } catch (error) {
      console.error('Erro ao excluir orçamento:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao excluir o orçamento.',
        variant: 'destructive'
      });
    }
  };
  
  const handleEditBudget = (budget: Budget) => {
    setSelectedBudget(budget);
    setShowEditBudgetDialog(true);
  };
  
  const getMonthName = (month: number) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month - 1];
  };
  
  const calculatePercentage = (spent: number, total: number) => {
    return Math.min(Math.round((spent / total) * 100), 100);
  };
  
  const getProgressBarColor = (percentage: number, threshold: number) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= threshold) return 'bg-amber-500';
    return 'bg-primary';
  };
  
  const changeMonth = (direction: 'prev' | 'next') => {
    let newMonth = currentMonth;
    let newYear = currentYear;
    
    if (direction === 'prev') {
      if (currentMonth === 1) {
        newMonth = 12;
        newYear--;
      } else {
        newMonth--;
      }
    } else {
      if (currentMonth === 12) {
        newMonth = 1;
        newYear++;
      } else {
        newMonth++;
      }
    }
    
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };
  
  const getCategoryExpenses = (categoryId: string) => {
    return transactions
      .filter(t => t.categoryId === categoryId && t.type === 'EXPENSE')
      .reduce((total, t) => total + t.amount, 0);
  };
  
  const getUnbudgetedCategories = () => {
    const budgetedCategoryIds = budgets.map(b => b.categoryId);
    return categories.filter(c => !budgetedCategoryIds.includes(c.id));
  };

  const getTotalBudgeted = () => {
    return budgets.reduce((total, budget) => total + budget.amount, 0);
  };
  
  const getTotalSpent = () => {
    return transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((total, t) => total + t.amount, 0);
  };
  
  const getBudgetAlertCount = () => {
    return budgets.filter(budget => {
      const percentage = calculatePercentage(budget.spentAmount, budget.amount);
      return percentage >= budget.alertThreshold;
    }).length;
  };
  
  const budgetAlertCount = getBudgetAlertCount();
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Planejamento Orçamentário</h1>
          <p className="text-muted-foreground">
            Defina limites de gastos por categoria e acompanhe suas despesas
          </p>
        </div>
        <Button onClick={() => setShowNewBudgetDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Orçamento
        </Button>
      </div>
      
      {/* Calendário de meses */}
      <div className="flex items-center justify-between bg-muted/40 p-3 rounded-lg">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => changeMonth('prev')}
        >
          Anterior
        </Button>
        
        <h2 className="text-lg font-medium">
          {getMonthName(currentMonth)} {currentYear}
        </h2>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => changeMonth('next')}
        >
          Próximo
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <>
          {/* Cards de resumo */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Orçamento Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {formatCurrency(getTotalBudgeted())}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {budgets.length} categorias com orçamento
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Gasto
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-baseline justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    R$ {formatCurrency(getTotalSpent())}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {Math.round((getTotalSpent() / getTotalBudgeted()) * 100)}% do orçamento
                  </div>
                </div>
                
                {getTotalSpent() > getTotalBudgeted() && (
                  <Badge variant="destructive" className="ml-2">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Excedido
                  </Badge>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Alertas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {budgetAlertCount}
                </div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center">
                  {budgetAlertCount === 0 ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                      Nenhuma categoria ultrapassou o limite
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-3 w-3 mr-1 text-amber-500" />
                      {budgetAlertCount} {budgetAlertCount === 1 ? 'categoria próxima' : 'categorias próximas'} do limite
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Alternador de visualização */}
          <div className="flex justify-between items-center">
            <Tabs value={currentView} onValueChange={(v) => setCurrentView(v as 'list' | 'chart')}>
              <TabsList>
                <TabsTrigger value="list">Lista</TabsTrigger>
                <TabsTrigger value="chart">Gráfico</TabsTrigger>
              </TabsList>
            </Tabs>
            
            {budgets.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push('/dashboard/reports')}
              >
                <PieChart className="h-4 w-4 mr-2" />
                Relatórios Detalhados
              </Button>
            )}
          </div>
          
          {/* Lista de orçamentos */}
          <TabsContent value="list" className="mt-0">
            {budgets.length === 0 ? (
              <div className="text-center py-10 bg-muted/30 rounded-lg">
                <div className="flex justify-center mb-4">
                  <BarChart className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">Sem orçamentos definidos</h3>
                <p className="text-muted-foreground mt-2 mb-4">
                  Defina limites de gastos para cada categoria para melhor controle financeiro.
                </p>
                <Button onClick={() => setShowNewBudgetDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar meu primeiro orçamento
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {budgets.map((budget) => {
                  const percentage = calculatePercentage(budget.spentAmount, budget.amount);
                  const isOverBudget = percentage >= 100;
                  const isNearThreshold = percentage >= budget.alertThreshold && percentage < 100;
                  
                  return (
                    <Card key={budget.id} className="overflow-hidden">
                      <div 
                        className="h-1" 
                        style={{ 
                          backgroundColor: budget.category.color,
                          width: '100%'
                        }}
                      />
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: budget.category.color }}
                            />
                            <h3 className="font-medium">{budget.category.name}</h3>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {isOverBudget && (
                              <Badge variant="destructive">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Excedido
                              </Badge>
                            )}
                            {isNearThreshold && !isOverBudget && (
                              <Badge variant="outline" className="border-amber-500 text-amber-500">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Alerta
                              </Badge>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 px-2"
                              onClick={() => handleEditBudget(budget)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>R$ {formatCurrency(budget.spentAmount)}</span>
                            <span>R$ {formatCurrency(budget.amount)}</span>
                          </div>
                          
                          <Progress 
                            value={percentage} 
                            className="h-2"
                            indicatorClassName={getProgressBarColor(percentage, budget.alertThreshold)}
                          />
                          
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{percentage}% usado</span>
                            <span>Alerta em {budget.alertThreshold}%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                
                {/* Categorias não orçadas */}
                {getUnbudgetedCategories().length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">
                      Categorias sem orçamento
                    </h3>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {getUnbudgetedCategories().map(category => {
                        const spent = getCategoryExpenses(category.id);
                        return (
                          <Card key={category.id} className="bg-muted/30">
                            <CardContent className="p-3 flex justify-between items-center">
                              <div className="flex items-center">
                                <div 
                                  className="w-2 h-2 rounded-full mr-2"
                                  style={{ backgroundColor: category.color }}
                                />
                                <span className="text-sm">{category.name}</span>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <span className="text-xs">
                                  R$ {formatCurrency(spent)} gastos
                                </span>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-7 w-7 p-0"
                                  onClick={() => {
                                    setNewBudget({
                                      ...newBudget,
                                      categoryId: category.id,
                                      amount: spent > 0 ? spent.toString() : ''
                                    });
                                    setShowNewBudgetDialog(true);
                                  }}
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
          
          {/* Visualização de gráfico */}
          <TabsContent value="chart" className="mt-0">
            <Card className="p-6">
              <div className="text-center text-muted-foreground mb-10">
                Visualização em gráfico em desenvolvimento.
                Essa funcionalidade mostrará seu orçamento em formato de gráficos
                para facilitar a visualização dos gastos por categoria.
              </div>
              <div className="flex justify-center">
                <PieChart className="h-32 w-32 text-muted-foreground/50" />
              </div>
            </Card>
          </TabsContent>
        </>
      )}

      {/* Dialog de novo orçamento */}
      <Dialog open={showNewBudgetDialog} onOpenChange={setShowNewBudgetDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Criar Novo Orçamento</DialogTitle>
            <DialogDescription>
              Defina um limite de gastos para uma categoria.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select
                value={newBudget.categoryId}
                onValueChange={(value) => setNewBudget({...newBudget, categoryId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {getUnbudgetedCategories().map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Valor do orçamento (R$) *</Label>
              <Input 
                id="amount" 
                type="number"
                min="0"
                step="0.01"
                value={newBudget.amount}
                onChange={(e) => setNewBudget({...newBudget, amount: e.target.value})}
                placeholder="500.00"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="alertThreshold">Limite de alerta</Label>
                <span className="text-sm">{newBudget.alertThreshold}%</span>
              </div>
              <Slider
                value={[newBudget.alertThreshold]}
                min={50}
                max={95}
                step={5}
                onValueChange={(value) => setNewBudget({...newBudget, alertThreshold: value[0]})}
              />
              <div className="text-xs text-muted-foreground">
                Você receberá alertas quando os gastos atingirem esta porcentagem do orçamento
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewBudgetDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={createBudget}>
              Criar Orçamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog de edição de orçamento */}
      <Dialog open={showEditBudgetDialog} onOpenChange={setShowEditBudgetDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Orçamento</DialogTitle>
            {selectedBudget && (
              <DialogDescription>
                Ajuste o orçamento para {selectedBudget.category.name}
              </DialogDescription>
            )}
          </DialogHeader>
          
          {selectedBudget && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-amount">Valor do orçamento (R$)</Label>
                <Input 
                  id="edit-amount" 
                  type="number"
                  min="0"
                  step="0.01"
                  value={selectedBudget.amount}
                  onChange={(e) => setSelectedBudget({
                    ...selectedBudget, 
                    amount: parseFloat(e.target.value) || 0
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="edit-threshold">Limite de alerta</Label>
                  <span className="text-sm">{selectedBudget.alertThreshold}%</span>
                </div>
                <Slider
                  value={[selectedBudget.alertThreshold]}
                  min={50}
                  max={95}
                  step={5}
                  onValueChange={(value) => setSelectedBudget({
                    ...selectedBudget, 
                    alertThreshold: value[0]
                  })}
                />
              </div>
              
              <div className="pt-2">
                <div className="flex justify-between mb-2 text-sm">
                  <span>Gasto atual</span>
                  <span>
                    R$ {formatCurrency(selectedBudget.spentAmount)} 
                    ({calculatePercentage(selectedBudget.spentAmount, selectedBudget.amount)}%)
                  </span>
                </div>
                <Progress 
                  value={calculatePercentage(selectedBudget.spentAmount, selectedBudget.amount)} 
                  className="h-2"
                  indicatorClassName={getProgressBarColor(
                    calculatePercentage(selectedBudget.spentAmount, selectedBudget.amount),
                    selectedBudget.alertThreshold
                  )}
                />
              </div>
            </div>
          )}
          
          <DialogFooter className="flex justify-between">
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => {
                if (selectedBudget) {
                  deleteBudget(selectedBudget.id);
                  setShowEditBudgetDialog(false);
                }
              }}
            >
              Excluir
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowEditBudgetDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={updateBudget}>
                Salvar Alterações
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 