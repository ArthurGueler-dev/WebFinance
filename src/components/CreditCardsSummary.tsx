"use client";

import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { CreditCard, PieChart, Wallet } from 'lucide-react';

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

interface CreditCardsSummaryProps {
  cards: CreditCardData[];
}

export default function CreditCardsSummary({ cards }: CreditCardsSummaryProps) {
  // Filtrar cartões por tipo
  const creditCards = cards.filter(card => card.cardType === 'CREDIT');
  const voucherCards = cards.filter(card => card.cardType === 'FOOD_VOUCHER');
  
  // Calcular estatísticas
  const totalLimit = creditCards.reduce((sum, card) => sum + card.limit, 0);
  const totalAvailableLimit = creditCards.reduce((sum, card) => sum + card.availableLimit, 0);
  const totalUsedLimit = totalLimit - totalAvailableLimit;
  const usedPercentage = totalLimit > 0 ? (totalUsedLimit / totalLimit) * 100 : 0;
  
  // Calcular estatísticas para vales alimentação
  const totalVoucherLimit = voucherCards.reduce((sum, card) => sum + card.limit, 0);
  const totalVoucherAvailable = voucherCards.reduce((sum, card) => sum + card.availableLimit, 0);
  
  // Encontrar cartão com menor limite disponível
  const lowestAvailableCard = creditCards.length > 0
    ? creditCards.reduce((prev, curr) => 
        (prev.availableLimit / prev.limit) < (curr.availableLimit / curr.limit) ? prev : curr
      )
    : null;
  
  // Calcular próximas faturas
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  const upcomingBills = creditCards
    .map(card => {
      // Se já passou do dia de fechamento, a próxima fatura é no próximo mês
      const nextBillMonth = today.getDate() >= card.closingDay 
        ? (currentMonth + 1) % 12
        : currentMonth;
      const nextBillYear = nextBillMonth < currentMonth 
        ? currentYear + 1 
        : currentYear;
      
      const closingDate = new Date(nextBillYear, nextBillMonth, card.closingDay);
      const dueDate = new Date(nextBillYear, nextBillMonth, card.dueDay);
      
      // Se o vencimento é antes do fechamento, ele acontece no mês seguinte
      if (dueDate < closingDate) {
        dueDate.setMonth(dueDate.getMonth() + 1);
      }
      
      return {
        cardId: card.id,
        cardName: card.name,
        closingDate,
        dueDate,
        estimatedValue: card.limit - card.availableLimit,
      };
    })
    .sort((a, b) => a.closingDate.getTime() - b.closingDate.getTime());

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
      <CardContent className="p-6">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-full">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm text-muted-foreground">Cartões de Crédito</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">
                  {creditCards.length}
                </span>
                {voucherCards.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    + {voucherCards.length} vales alimentação
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {creditCards.length > 0 && (
            <>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm text-muted-foreground">Limite Total</h4>
                    <p className="text-xl font-semibold">R$ {formatCurrency(totalLimit)}</p>
                  </div>
                  <div className="text-right">
                    <h4 className="text-sm text-muted-foreground">Disponível</h4>
                    <p className="text-xl font-semibold text-green-600">
                      R$ {formatCurrency(totalAvailableLimit)}
                    </p>
                  </div>
                </div>
                
                {/* Barra de progresso global */}
                <div className="relative pt-1">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      {usedPercentage.toFixed(0)}% utilizado
                    </div>
                    <div className="text-xs text-muted-foreground">
                      R$ {formatCurrency(totalUsedLimit)} em uso
                    </div>
                  </div>
                  <div className="w-full h-2 mt-1 rounded-full bg-muted">
                    <div 
                      className={`h-full rounded-full ${usedPercentage > 80 ? 'bg-red-500' : 'bg-primary'}`}
                      style={{ width: `${Math.min(usedPercentage, 100)}%` }}
                    />
                  </div>
                </div>
                
                {lowestAvailableCard && (
                  <div className="flex justify-between items-center mt-2 p-2 rounded-lg bg-muted/50">
                    <div>
                      <h5 className="text-xs text-muted-foreground">Cartão com menor disponibilidade</h5>
                      <p className="text-sm font-medium">{lowestAvailableCard.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Disponível</p>
                      <p className={`text-sm font-medium ${(lowestAvailableCard.availableLimit / lowestAvailableCard.limit) < 0.2 ? 'text-red-600' : ''}`}>
                        {((lowestAvailableCard.availableLimit / lowestAvailableCard.limit) * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {upcomingBills.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Próximas Faturas</h4>
                  <div className="space-y-2">
                    {upcomingBills.slice(0, 2).map(bill => (
                      <div key={bill.cardId} className="flex justify-between items-center p-2 rounded-lg bg-muted/30">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {bill.cardName}
                          </p>
                          <p className="text-xs">
                            Fecha: {bill.closingDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            Vence: {bill.dueDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </p>
                          <p className="text-sm font-semibold">
                            ~R$ {formatCurrency(bill.estimatedValue)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          
          {voucherCards.length > 0 && (
            <div className="border-t pt-4 mt-2">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-500/20 rounded-full">
                  <Wallet className="h-4 w-4 text-green-600" />
                </div>
                <h4 className="text-sm font-medium">Vales Alimentação</h4>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-sm font-medium">R$ {formatCurrency(totalVoucherLimit)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Disponível</p>
                  <p className="text-sm font-medium text-green-600">
                    R$ {formatCurrency(totalVoucherAvailable)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 