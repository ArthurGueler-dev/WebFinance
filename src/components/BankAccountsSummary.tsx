"use client";

import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface BankAccount {
  id: string;
  name: string;
  initialBalance: number;
  currentBalance: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface BankAccountsSummaryProps {
  accounts: BankAccount[];
}

export default function BankAccountsSummary({ accounts }: BankAccountsSummaryProps) {
  const totalBalance = accounts.reduce((sum, account) => sum + account.currentBalance, 0);
  const totalInitialBalance = accounts.reduce((sum, account) => sum + account.initialBalance, 0);
  const difference = totalBalance - totalInitialBalance;
  const percentChange = totalInitialBalance ? (difference / totalInitialBalance) * 100 : 0;

  // Encontrar a conta com maior saldo
  const highestBalanceAccount = accounts.length > 0 
    ? accounts.reduce((prev, current) => 
        prev.currentBalance > current.currentBalance ? prev : current
      ) 
    : null;

  // Encontrar a conta com menor saldo
  const lowestBalanceAccount = accounts.length > 0 
    ? accounts.reduce((prev, current) => 
        prev.currentBalance < current.currentBalance ? prev : current
      ) 
    : null;

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
      <CardContent className="p-6">
        <div className="flex flex-col">
          <div className="flex flex-col mb-6">
            <h3 className="text-muted-foreground text-sm">Saldo Total</h3>
            <span className={`text-3xl font-bold ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {formatCurrency(totalBalance)}
            </span>
            
            {accounts.length > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <span className={`text-xs ${difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {difference >= 0 ? '▲' : '▼'} {formatCurrency(Math.abs(difference))}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({difference >= 0 ? '+' : ''}{percentChange.toFixed(1)}% desde o início)
                </span>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <h4 className="text-xs text-muted-foreground">Total de Contas</h4>
              <p className="text-lg font-semibold">{accounts.length}</p>
            </div>
            
            {highestBalanceAccount && (
              <div className="space-y-1">
                <h4 className="text-xs text-muted-foreground">Maior Saldo</h4>
                <p className="text-lg font-semibold text-green-600">
                  R$ {formatCurrency(highestBalanceAccount.currentBalance)}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {highestBalanceAccount.name}
                </p>
              </div>
            )}
            
            {lowestBalanceAccount && accounts.length > 1 && (
              <div className="space-y-1">
                <h4 className="text-xs text-muted-foreground">Menor Saldo</h4>
                <p className={`text-lg font-semibold ${lowestBalanceAccount.currentBalance < 0 ? 'text-red-600' : ''}`}>
                  R$ {formatCurrency(lowestBalanceAccount.currentBalance)}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {lowestBalanceAccount.name}
                </p>
              </div>
            )}
            
            {accounts.length > 0 && (
              <div className="space-y-1">
                <h4 className="text-xs text-muted-foreground">Média por Conta</h4>
                <p className="text-lg font-semibold">
                  R$ {formatCurrency(totalBalance / accounts.length)}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 