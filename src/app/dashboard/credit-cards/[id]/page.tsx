'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { toast } from '@/components/ui/use-toast';

interface PageProps {
  params: {
    id: string;
  };
}

interface CreditCard {
  id: string;
  name: string;
  limit: number;
  dueDay: number;
  closingDay: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export default function EditCreditCard({ params }: PageProps) {
  const { id } = params;
  const router = useRouter();
  
  // Estado do formulário e carregamento
  const [creditCard, setCreditCard] = useState<Partial<CreditCard>>({
    name: '',
    limit: 0,
    dueDay: 1,
    closingDay: 1
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Carregar dados do cartão
  useEffect(() => {
    const fetchCreditCard = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/credit-cards/${id}`);
        if (!response.ok) {
          throw new Error('Falha ao carregar detalhes do cartão');
        }
        const data = await response.json();
        setCreditCard({
          name: data.name,
          limit: data.limit,
          dueDay: data.dueDay,
          closingDay: data.closingDay
        });
      } catch (error) {
        console.error('Erro ao carregar cartão:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os detalhes do cartão.',
          variant: 'destructive'
        });
        router.push('/dashboard/credit-cards');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCreditCard();
  }, [id, router]);
  
  // Atualizar estado do formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCreditCard(prev => ({
      ...prev,
      [name]: name === 'limit' ? parseFloat(value) : 
              (name === 'dueDay' || name === 'closingDay') ? parseInt(value) : 
              value
    }));
  };
  
  // Enviar formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const isVoucherCard = creditCard.name?.includes('[Vale Alimentação]');
      
      const response = await fetch(`/api/credit-cards/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: creditCard.name,
          limit: creditCard.limit,
          dueDay: creditCard.dueDay,
          closingDay: creditCard.closingDay
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Falha ao atualizar o cartão');
      }
      
      toast({
        title: 'Cartão atualizado',
        description: 'O cartão foi atualizado com sucesso.'
      });
      
      router.push('/dashboard/credit-cards');
    } catch (error) {
      console.error('Erro ao atualizar cartão:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao atualizar o cartão.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Verificar se é um cartão de vale alimentação
  const isVoucherCard = creditCard.name?.includes('[Vale Alimentação]');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Editar Cartão de Crédito</h1>
      </div>
      
      {isLoading ? (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <p className="text-center">Carregando dados do cartão...</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium leading-none">
                Nome do Cartão
              </label>
              <Input
                id="name"
                name="name"
                value={creditCard.name}
                onChange={handleChange}
                required
                disabled={isSaving}
                placeholder="Nome do cartão"
              />
              {isVoucherCard && (
                <p className="text-xs text-amber-600">
                  Este cartão está marcado como Vale Alimentação pelo sufixo [Vale Alimentação]
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="limit" className="text-sm font-medium leading-none">
                {isVoucherCard ? 'Limite do Vale Alimentação' : 'Limite do Cartão'}
              </label>
              <Input
                id="limit"
                name="limit"
                type="number"
                step="0.01"
                min="0"
                value={creditCard.limit}
                onChange={handleChange}
                required
                disabled={isSaving}
                placeholder="1000.00"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="dueDay" className="text-sm font-medium leading-none">
                  {isVoucherCard ? 'Dia da Recarga' : 'Dia do Vencimento'}
                </label>
                <Input
                  id="dueDay"
                  name="dueDay"
                  type="number"
                  min="1"
                  max="31"
                  value={creditCard.dueDay}
                  onChange={handleChange}
                  required
                  disabled={isSaving}
                  placeholder="10"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="closingDay" className="text-sm font-medium leading-none">
                  {isVoucherCard ? 'Dia do Fechamento' : 'Dia do Fechamento da Fatura'}
                </label>
                <Input
                  id="closingDay"
                  name="closingDay"
                  type="number"
                  min="1"
                  max="31"
                  value={creditCard.closingDay}
                  onChange={handleChange}
                  required
                  disabled={isSaving}
                  placeholder="5"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Link href="/dashboard/credit-cards">
                <Button variant="outline" type="button" disabled={isSaving}>
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
} 