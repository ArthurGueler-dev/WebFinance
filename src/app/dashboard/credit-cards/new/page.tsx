'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { toast } from '@/components/ui/use-toast';

export default function NewCreditCard() {
  const router = useRouter();
  
  // Estado do formulário
  const [creditCard, setCreditCard] = useState({
    name: '',
    limit: 0,
    dueDay: 1,
    closingDay: 1,
    cardType: 'CREDIT'
  });
  
  const [isLoading, setIsLoading] = useState(false);
  
  // Atualizar estado do formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'dueDay' || name === 'closingDay') {
      // Validar dias entre 1 e 31
      const numValue = parseInt(value);
      if (value === '' || (numValue >= 1 && numValue <= 31)) {
        setCreditCard({
          ...creditCard,
          [name]: value === '' ? '' : numValue
        });
      }
    } else if (name === 'limit') {
      // Converter para número
      setCreditCard({
        ...creditCard,
        [name]: value === '' ? '' : parseFloat(value)
      });
    } else {
      // Para outros campos
      setCreditCard({
        ...creditCard,
        [name]: value
      });
    }
  };
  
  // Enviar formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/credit-cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(creditCard)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Falha ao criar o cartão');
      }
      
      toast({
        title: 'Cartão adicionado',
        description: 'O cartão foi adicionado com sucesso.'
      });
      
      router.push('/dashboard/credit-cards');
    } catch (error) {
      console.error('Erro ao criar cartão:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao criar o cartão.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Adicionar Novo Cartão</h1>
      </div>
      
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
              disabled={isLoading}
              placeholder="Nome do cartão"
            />
            <p className="text-xs text-muted-foreground">
              Adicione [Vale Alimentação] ao final se for um cartão de benefício alimentação
            </p>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="limit" className="text-sm font-medium leading-none">
              Limite do Cartão
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
              disabled={isLoading}
              placeholder="1000.00"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="dueDay" className="text-sm font-medium leading-none">
                Dia do Vencimento
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
                disabled={isLoading}
                placeholder="10"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="closingDay" className="text-sm font-medium leading-none">
                Dia do Fechamento da Fatura
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
                disabled={isLoading}
                placeholder="5"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="cardType" className="text-sm font-medium leading-none">
              Tipo de Cartão
            </label>
            <select
              id="cardType"
              name="cardType"
              value={creditCard.cardType}
              onChange={handleChange}
              required
              disabled={isLoading}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="CREDIT">Cartão de Crédito</option>
              <option value="DEBIT">Cartão de Débito</option>
              <option value="FOOD_VOUCHER">Vale Alimentação</option>
            </select>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Link href="/dashboard/credit-cards">
              <Button variant="outline" type="button" disabled={isLoading}>
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Adicionar Cartão'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 