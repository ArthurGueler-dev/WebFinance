'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Pencil, Trash2, Plus, Target, Calendar } from 'lucide-react';

// Interfaces
interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  startDate: string;
  targetDate: string;
  description?: string;
  color?: string;
  icon?: string;
  completed: boolean;
}

export default function FinancialGoalsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [financialGoals, setFinancialGoals] = useState<FinancialGoal[]>([]);
  
  // Estados para o modal de novo objetivo
  const [isNewGoalDialogOpen, setIsNewGoalDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: '',
    targetDate: '',
    description: '',
    color: '#3b82f6', // Azul como cor padrão
    icon: '💰',
  });
  
  // Estados para o modal de contribuição
  const [isContributeDialogOpen, setIsContributeDialogOpen] = useState(false);
  const [currentGoal, setCurrentGoal] = useState<FinancialGoal | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');
  const [contributionOperation, setContributionOperation] = useState('add');
  
  // Estados para o modal de exclusão
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<FinancialGoal | null>(null);

  // Carregar objetivos financeiros
  useEffect(() => {
    fetchFinancialGoals();
  }, []);

  const fetchFinancialGoals = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/financial-goals');
      if (!response.ok) throw new Error('Falha ao carregar objetivos financeiros');
      
      const data = await response.json();
      setFinancialGoals(data);
    } catch (error) {
      console.error('Erro ao buscar objetivos financeiros:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar seus objetivos financeiros.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Manipuladores para o modal de novo objetivo
  const handleNewGoalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewGoal({ ...newGoal, [name]: value });
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newGoal.name || !newGoal.targetAmount || !newGoal.targetDate) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o nome, valor alvo e data limite.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const response = await fetch('/api/financial-goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newGoal),
      });
      
      if (!response.ok) throw new Error('Falha ao criar objetivo financeiro');
      
      // Recarregar objetivos
      await fetchFinancialGoals();
      
      // Limpar e fechar modal
      setNewGoal({
        name: '',
        targetAmount: '',
        targetDate: '',
        description: '',
        color: '#3b82f6',
        icon: '💰',
      });
      setIsNewGoalDialogOpen(false);
      
      toast({
        title: 'Sucesso',
        description: 'Objetivo financeiro criado com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao criar objetivo financeiro:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o objetivo financeiro.',
        variant: 'destructive',
      });
    }
  };

  // Manipuladores para o modal de contribuição
  const handleOpenContributeDialog = (goal: FinancialGoal) => {
    setCurrentGoal(goal);
    setContributionAmount('');
    setContributionOperation('add');
    setIsContributeDialogOpen(true);
  };

  const handleContributionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentGoal || !contributionAmount || parseFloat(contributionAmount) <= 0) {
      toast({
        title: 'Valor inválido',
        description: 'Digite um valor válido para contribuição.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const response = await fetch(`/api/financial-goals/${currentGoal.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: contributionAmount,
          operation: contributionOperation,
        }),
      });
      
      if (!response.ok) throw new Error('Falha ao atualizar objetivo financeiro');
      
      // Recarregar objetivos
      await fetchFinancialGoals();
      
      // Fechar modal
      setIsContributeDialogOpen(false);
      
      const operationText = contributionOperation === 'add' 
        ? 'adicionado ao' 
        : contributionOperation === 'subtract' 
          ? 'subtraído do' 
          : 'definido para o';
          
      toast({
        title: 'Sucesso',
        description: `Valor ${operationText} objetivo com sucesso!`,
      });
    } catch (error) {
      console.error('Erro ao atualizar objetivo financeiro:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o objetivo financeiro.',
        variant: 'destructive',
      });
    }
  };

  // Manipuladores para o modal de exclusão
  const handleOpenDeleteDialog = (goal: FinancialGoal) => {
    setGoalToDelete(goal);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteGoal = async () => {
    if (!goalToDelete) return;
    
    try {
      const response = await fetch(`/api/financial-goals/${goalToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Falha ao excluir objetivo financeiro');
      
      // Recarregar objetivos
      await fetchFinancialGoals();
      
      // Fechar modal
      setIsDeleteDialogOpen(false);
      
      toast({
        title: 'Sucesso',
        description: 'Objetivo financeiro excluído com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao excluir objetivo financeiro:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o objetivo financeiro.',
        variant: 'destructive',
      });
    }
  };

  // Função para calcular o progresso percentual
  const calculateProgress = (current: number, target: number) => {
    if (target <= 0) return 0;
    const progress = Math.min((current / target) * 100, 100);
    return Math.round(progress);
  };

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Objetivos Financeiros</h1>
        <Button onClick={() => setIsNewGoalDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Novo Objetivo
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-10">Carregando objetivos financeiros...</div>
      ) : financialGoals.length === 0 ? (
        <div className="text-center py-10 bg-slate-100 rounded-md">
          <Target className="mx-auto h-12 w-12 text-slate-400 mb-4" />
          <h3 className="text-lg font-medium">Você ainda não tem objetivos financeiros</h3>
          <p className="text-slate-500 mb-4">Defina metas financeiras e acompanhe seu progresso.</p>
          <Button onClick={() => setIsNewGoalDialogOpen(true)}>
            Criar seu primeiro objetivo
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {financialGoals.map((goal) => (
            <Card key={goal.id} className={goal.completed ? 'border-green-500' : ''}>
              <CardHeader className="pb-2" style={{ backgroundColor: goal.color || '#3b82f6', color: 'white' }}>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{goal.name}</CardTitle>
                  <div>
                    {goal.icon || '💰'}
                  </div>
                </div>
                <div className="text-sm flex items-center mt-1">
                  <Calendar className="h-4 w-4 mr-1" /> 
                  Até {new Date(goal.targetDate).toLocaleDateString()}
                </div>
              </CardHeader>
              <CardContent className="py-4">
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progresso</span>
                    <span>{calculateProgress(goal.currentAmount, goal.targetAmount)}%</span>
                  </div>
                  <Progress 
                    value={calculateProgress(goal.currentAmount, goal.targetAmount)} 
                    className={goal.completed ? 'bg-green-100' : 'bg-slate-100'} 
                  />
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-slate-500">Atual:</span>
                  <span className="font-medium">{formatCurrency(goal.currentAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Meta:</span>
                  <span className="font-medium">{formatCurrency(goal.targetAmount)}</span>
                </div>
                {goal.description && (
                  <div className="mt-3 text-sm text-slate-500">
                    {goal.description}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between pt-0">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleOpenDeleteDialog(goal)}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Excluir
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => handleOpenContributeDialog(goal)}
                >
                  <Plus className="h-4 w-4 mr-1" /> Contribuir
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Novo Objetivo */}
      <Dialog open={isNewGoalDialogOpen} onOpenChange={setIsNewGoalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Objetivo Financeiro</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateGoal}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nome
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Ex: Viagem de férias"
                  value={newGoal.name}
                  onChange={handleNewGoalChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="targetAmount" className="text-right">
                  Valor Alvo
                </Label>
                <Input
                  id="targetAmount"
                  name="targetAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ex: 5000"
                  value={newGoal.targetAmount}
                  onChange={handleNewGoalChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="targetDate" className="text-right">
                  Data Limite
                </Label>
                <Input
                  id="targetDate"
                  name="targetDate"
                  type="date"
                  value={newGoal.targetDate}
                  onChange={handleNewGoalChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="color" className="text-right">
                  Cor
                </Label>
                <div className="col-span-3 flex items-center gap-2">
                  <Input
                    id="color"
                    name="color"
                    type="color"
                    value={newGoal.color}
                    onChange={handleNewGoalChange}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    name="icon"
                    placeholder="Ícone (emoji)"
                    value={newGoal.icon}
                    onChange={handleNewGoalChange}
                    className="w-24"
                    maxLength={2}
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Descrição
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Descreva seu objetivo (opcional)"
                  value={newGoal.description}
                  onChange={handleNewGoalChange}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Criar Objetivo</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Contribuição */}
      <Dialog open={isContributeDialogOpen} onOpenChange={setIsContributeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentGoal ? `Contribuir para: ${currentGoal.name}` : 'Contribuir'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleContributionSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="operation" className="text-right">
                  Operação
                </Label>
                <select
                  id="operation"
                  value={contributionOperation}
                  onChange={(e) => setContributionOperation(e.target.value)}
                  className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="add">Adicionar valor</option>
                  <option value="subtract">Subtrair valor</option>
                  <option value="set">Definir valor total</option>
                </select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">
                  Valor
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ex: 100"
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
              {currentGoal && (
                <div className="col-span-4 bg-slate-100 p-3 rounded">
                  <div className="mb-2">
                    <span className="text-sm font-medium">Valor atual: </span>
                    <span>{formatCurrency(currentGoal.currentAmount)}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Meta: </span>
                    <span>{formatCurrency(currentGoal.targetAmount)}</span>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="submit">Confirmar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Objetivo Financeiro</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Tem certeza que deseja excluir o objetivo{' '}
              <span className="font-medium">
                {goalToDelete?.name}
              </span>
              ?
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Esta ação não pode ser desfeita.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteGoal}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 