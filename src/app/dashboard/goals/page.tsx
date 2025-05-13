'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import { 
  Plus, 
  Target, 
  Calendar, 
  DollarSign,
  MoreHorizontal,
  Edit,
  Trash,
  CheckCircle,
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';

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
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewGoalDialog, setShowNewGoalDialog] = useState(false);
  const [showEditGoalDialog, setShowEditGoalDialog] = useState(false);
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<FinancialGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const router = useRouter();
  
  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: '',
    targetDate: '',
    description: '',
    color: '#4f46e5' // Cor padrão (indigo)
  });
  
  useEffect(() => {
    fetchGoals();
  }, []);
  
  const fetchGoals = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/financial-goals');
      
      if (!response.ok) {
        throw new Error(`Erro ao carregar objetivos: ${response.status}`);
      }
      
      const data = await response.json();
      setGoals(data);
    } catch (error) {
      console.error('Erro ao carregar objetivos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar seus objetivos financeiros.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const createGoal = async () => {
    try {
      if (!newGoal.name || !newGoal.targetAmount || !newGoal.targetDate) {
        toast({
          title: 'Campos obrigatórios',
          description: 'Preencha todos os campos obrigatórios.',
          variant: 'destructive'
        });
        return;
      }
      
      const response = await fetch('/api/financial-goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newGoal.name,
          targetAmount: parseFloat(newGoal.targetAmount),
          targetDate: new Date(newGoal.targetDate).toISOString(),
          description: newGoal.description,
          color: newGoal.color
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao criar objetivo: ${response.status}`);
      }
      
      await fetchGoals();
      setShowNewGoalDialog(false);
      setNewGoal({
        name: '',
        targetAmount: '',
        targetDate: '',
        description: '',
        color: '#4f46e5'
      });
      
      toast({
        title: 'Objetivo criado',
        description: 'Seu objetivo financeiro foi criado com sucesso!'
      });
    } catch (error) {
      console.error('Erro ao criar objetivo:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao criar o objetivo.',
        variant: 'destructive'
      });
    }
  };
  
  const updateGoal = async () => {
    if (!selectedGoal) return;
    
    try {
      const response = await fetch(`/api/financial-goals/${selectedGoal.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: selectedGoal.name,
          targetAmount: selectedGoal.targetAmount,
          targetDate: new Date(selectedGoal.targetDate).toISOString(),
          description: selectedGoal.description,
          color: selectedGoal.color
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao atualizar objetivo: ${response.status}`);
      }
      
      await fetchGoals();
      setShowEditGoalDialog(false);
      
      toast({
        title: 'Objetivo atualizado',
        description: 'As alterações foram salvas com sucesso!'
      });
    } catch (error) {
      console.error('Erro ao atualizar objetivo:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao atualizar o objetivo.',
        variant: 'destructive'
      });
    }
  };
  
  const deleteGoal = async (goalId: string) => {
    try {
      const response = await fetch(`/api/financial-goals/${goalId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao excluir objetivo: ${response.status}`);
      }
      
      setGoals(goals.filter(goal => goal.id !== goalId));
      
      toast({
        title: 'Objetivo excluído',
        description: 'O objetivo foi excluído com sucesso.'
      });
    } catch (error) {
      console.error('Erro ao excluir objetivo:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao excluir o objetivo.',
        variant: 'destructive'
      });
    }
  };
  
  const makeDeposit = async () => {
    if (!selectedGoal || !depositAmount) return;
    
    try {
      const amount = parseFloat(depositAmount);
      
      if (isNaN(amount) || amount <= 0) {
        toast({
          title: 'Valor inválido',
          description: 'Informe um valor válido maior que zero.',
          variant: 'destructive'
        });
        return;
      }
      
      const response = await fetch(`/api/financial-goals/${selectedGoal.id}/deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao fazer depósito: ${response.status}`);
      }
      
      await fetchGoals();
      setShowDepositDialog(false);
      setDepositAmount('');
      
      toast({
        title: 'Depósito realizado',
        description: `R$ ${formatCurrency(amount)} adicionados ao seu objetivo!`
      });
    } catch (error) {
      console.error('Erro ao fazer depósito:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao adicionar valor ao objetivo.',
        variant: 'destructive'
      });
    }
  };
  
  const handleEditGoal = (goal: FinancialGoal) => {
    setSelectedGoal({
      ...goal,
      targetDate: new Date(goal.targetDate).toISOString().split('T')[0]
    });
    setShowEditGoalDialog(true);
  };
  
  const handleOpenDepositDialog = (goal: FinancialGoal) => {
    setSelectedGoal(goal);
    setShowDepositDialog(true);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  const calculatePercentage = (current: number, target: number) => {
    return Math.min(Math.round((current / target) * 100), 100);
  };
  
  const calculateTimeLeft = (targetDate: string) => {
    const target = new Date(targetDate);
    const now = new Date();
    
    // Diferença em milissegundos
    const diff = target.getTime() - now.getTime();
    
    // Se já passou da data
    if (diff < 0) {
      return 'Prazo encerrado';
    }
    
    // Cálculo de dias restantes
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days > 30) {
      const months = Math.floor(days / 30);
      return `${months} ${months === 1 ? 'mês' : 'meses'} restantes`;
    }
    
    return `${days} ${days === 1 ? 'dia' : 'dias'} restantes`;
  };
  
  const getGoalCardStyle = (goal: FinancialGoal) => {
    // Se o goal tiver uma cor definida, usar como base para o gradiente
    const baseColor = goal.color || '#4f46e5';
    
    return {
      background: `linear-gradient(135deg, ${baseColor}10, ${baseColor}20)`,
      borderLeft: `4px solid ${baseColor}`
    };
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Objetivos Financeiros</h1>
        <Button onClick={() => setShowNewGoalDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Objetivo
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : goals.length === 0 ? (
        <div className="text-center py-10 bg-muted/50 rounded-lg">
          <div className="flex justify-center mb-4">
            <Target className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">Você não possui objetivos financeiros</h3>
          <p className="text-muted-foreground mt-2 mb-4">
            Crie objetivos para acompanhar seu progresso em direção às suas metas financeiras.
          </p>
          <Button onClick={() => setShowNewGoalDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Criar meu primeiro objetivo
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <Card key={goal.id} style={getGoalCardStyle(goal)}>
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-lg">{goal.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {goal.description || 'Sem descrição'}
                    </p>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleOpenDepositDialog(goal)}>
                        <DollarSign className="h-4 w-4 mr-2" />
                        Adicionar valor
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditGoal(goal)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar objetivo
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => deleteGoal(goal.id)}
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Excluir objetivo
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="mt-4 space-y-4">
                  {/* Progresso */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">
                        R$ {formatCurrency(goal.currentAmount)}
                      </span>
                      <span className="text-sm">
                        R$ {formatCurrency(goal.targetAmount)}
                      </span>
                    </div>
                    <Progress 
                      value={calculatePercentage(goal.currentAmount, goal.targetAmount)} 
                      className="h-2"
                    />
                    <div className="text-xs text-right mt-1 text-muted-foreground">
                      {calculatePercentage(goal.currentAmount, goal.targetAmount)}% concluído
                    </div>
                  </div>
                  
                  {/* Informações adicionais */}
                  <div className="pt-2 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Meta para: {formatDate(goal.targetDate)}</span>
                    </div>
                    <span className={`text-xs font-medium ${new Date(goal.targetDate) < new Date() ? 'text-red-500' : 'text-amber-500'}`}>
                      {calculateTimeLeft(goal.targetDate)}
                    </span>
                  </div>
                  
                  {/* Botão de ação */}
                  <Button 
                    className="w-full"
                    onClick={() => handleOpenDepositDialog(goal)}
                  >
                    Adicionar valor
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Dialog de novo objetivo */}
      <Dialog open={showNewGoalDialog} onOpenChange={setShowNewGoalDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Criar Novo Objetivo</DialogTitle>
            <DialogDescription>
              Defina uma meta financeira e acompanhe seu progresso.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do objetivo *</Label>
              <Input 
                id="name" 
                value={newGoal.name}
                onChange={(e) => setNewGoal({...newGoal, name: e.target.value})}
                placeholder="Exemplo: Férias, Poupança, Novo carro"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="targetAmount">Valor da meta (R$) *</Label>
              <Input 
                id="targetAmount" 
                type="number"
                min="0"
                step="0.01"
                value={newGoal.targetAmount}
                onChange={(e) => setNewGoal({...newGoal, targetAmount: e.target.value})}
                placeholder="5000.00"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="targetDate">Data limite *</Label>
              <Input 
                id="targetDate" 
                type="date"
                value={newGoal.targetDate}
                onChange={(e) => setNewGoal({...newGoal, targetDate: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Input 
                id="description" 
                value={newGoal.description}
                onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                placeholder="Descreva seu objetivo"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="color">Cor</Label>
              <div className="flex items-center gap-3">
                <Input 
                  id="color" 
                  type="color" 
                  value={newGoal.color}
                  className="w-12 h-10 p-1"
                  onChange={(e) => setNewGoal({...newGoal, color: e.target.value})}
                />
                <span className="text-sm text-muted-foreground">
                  Escolha uma cor para identificar seu objetivo
                </span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewGoalDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={createGoal}>
              Criar Objetivo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog de edição de objetivo */}
      <Dialog open={showEditGoalDialog} onOpenChange={setShowEditGoalDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Objetivo</DialogTitle>
          </DialogHeader>
          
          {selectedGoal && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome do objetivo</Label>
                <Input 
                  id="edit-name" 
                  value={selectedGoal.name}
                  onChange={(e) => setSelectedGoal({...selectedGoal, name: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-targetAmount">Valor da meta (R$)</Label>
                <Input 
                  id="edit-targetAmount" 
                  type="number"
                  min="0"
                  step="0.01"
                  value={selectedGoal.targetAmount}
                  onChange={(e) => setSelectedGoal({...selectedGoal, targetAmount: parseFloat(e.target.value) || 0})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-targetDate">Data limite</Label>
                <Input 
                  id="edit-targetDate" 
                  type="date"
                  value={typeof selectedGoal.targetDate === 'string' ? selectedGoal.targetDate : new Date(selectedGoal.targetDate).toISOString().split('T')[0]}
                  onChange={(e) => setSelectedGoal({...selectedGoal, targetDate: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-description">Descrição</Label>
                <Input 
                  id="edit-description" 
                  value={selectedGoal.description || ''}
                  onChange={(e) => setSelectedGoal({...selectedGoal, description: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-color">Cor</Label>
                <div className="flex items-center gap-3">
                  <Input 
                    id="edit-color" 
                    type="color" 
                    value={selectedGoal.color || '#4f46e5'}
                    className="w-12 h-10 p-1"
                    onChange={(e) => setSelectedGoal({...selectedGoal, color: e.target.value})}
                  />
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditGoalDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={updateGoal}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog de depósito */}
      <Dialog open={showDepositDialog} onOpenChange={setShowDepositDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adicionar Valor ao Objetivo</DialogTitle>
            {selectedGoal && (
              <DialogDescription>
                Adicione um valor à sua meta "{selectedGoal.name}"
              </DialogDescription>
            )}
          </DialogHeader>
          
          {selectedGoal && (
            <div className="space-y-4 py-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Progresso atual</span>
                  <span>
                    {calculatePercentage(selectedGoal.currentAmount, selectedGoal.targetAmount)}%
                  </span>
                </div>
                <Progress 
                  value={calculatePercentage(selectedGoal.currentAmount, selectedGoal.targetAmount)} 
                  className="h-2"
                />
              </div>
              
              <div className="flex justify-between">
                <div className="text-sm">
                  <p className="text-muted-foreground">Valor atual</p>
                  <p className="font-medium">R$ {formatCurrency(selectedGoal.currentAmount)}</p>
                </div>
                <div className="text-sm text-right">
                  <p className="text-muted-foreground">Meta</p>
                  <p className="font-medium">R$ {formatCurrency(selectedGoal.targetAmount)}</p>
                </div>
              </div>
              
              <div className="pt-4 space-y-2">
                <Label htmlFor="deposit-amount">Valor a adicionar (R$)</Label>
                <Input 
                  id="deposit-amount" 
                  type="number"
                  min="0"
                  step="0.01"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="100.00"
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDepositDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={makeDeposit}>
              Adicionar Valor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 