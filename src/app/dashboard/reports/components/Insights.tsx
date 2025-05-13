'use client';

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, TrendingUp, AlertTriangle, ArrowUpRight, CreditCard, Calendar, Info } from "lucide-react";

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

interface InsightsProps {
  data: DataSummary;
  isComparing: boolean;
}

export function Insights({ data, isComparing }: InsightsProps) {
  const generateInsights = () => {
    const insights = [];

    // Insight: Income vs Expense trend
    if (isComparing && data.previousPeriod) {
      const incomeChange = ((data.currentPeriod.income - data.previousPeriod.income) / data.previousPeriod.income) * 100;
      const expenseChange = ((data.currentPeriod.expense - data.previousPeriod.expense) / data.previousPeriod.expense) * 100;
      
      if (Math.abs(incomeChange) > 10) {
        insights.push({
          type: incomeChange > 0 ? 'success' : 'destructive',
          title: `Receitas ${incomeChange > 0 ? 'aumentaram' : 'diminuíram'} em ${Math.abs(incomeChange).toFixed(1)}%`,
          description: `Suas receitas ${incomeChange > 0 ? 'tiveram um aumento' : 'sofreram uma queda'} de ${Math.abs(incomeChange).toFixed(1)}% em comparação com o período anterior.`,
          icon: incomeChange > 0 ? TrendingUp : TrendingDown
        });
      }
      
      if (Math.abs(expenseChange) > 10) {
        insights.push({
          type: expenseChange < 0 ? 'success' : 'warning',
          title: `Despesas ${expenseChange > 0 ? 'aumentaram' : 'diminuíram'} em ${Math.abs(expenseChange).toFixed(1)}%`,
          description: `Suas despesas ${expenseChange > 0 ? 'tiveram um aumento' : 'sofreram uma queda'} de ${Math.abs(expenseChange).toFixed(1)}% em comparação com o período anterior.`,
          icon: expenseChange > 0 ? TrendingUp : TrendingDown
        });
      }
    }

    // Insight: Top category
    if (data.currentPeriod.topCategory) {
      insights.push({
        type: 'default',
        title: `Maior categoria de gasto: ${data.currentPeriod.topCategory.name}`,
        description: `Você gastou R$ ${data.currentPeriod.topCategory.amount.toFixed(2)} (${data.currentPeriod.topCategory.percentage.toFixed(1)}% do total) com ${data.currentPeriod.topCategory.name}.`,
        icon: Info
      });
    }

    // Insight: Categories with significant growth
    if (data.currentPeriod.categoriesGrowth) {
      Object.entries(data.currentPeriod.categoriesGrowth)
        .filter(([_, growth]) => growth > 30)
        .slice(0, 2) // Only show top 2 growing categories
        .forEach(([category, growth]) => {
          insights.push({
            type: 'warning',
            title: `Aumento em ${category}`,
            description: `A categoria ${category} aumentou ${growth.toFixed(1)}% em relação ao período anterior.`,
            icon: ArrowUpRight
          });
        });
    }

    // Insight: Credit card limits approaching
    if (data.creditCards) {
      Object.entries(data.creditCards)
        .filter(([_, card]) => card.percentage > 80)
        .forEach(([cardName, card]) => {
          insights.push({
            type: 'warning',
            title: `Limite do cartão ${cardName} próximo`,
            description: `Você já utilizou ${card.percentage.toFixed(1)}% do limite do cartão ${cardName}. Disponível: R$ ${card.available.toFixed(2)}.`,
            icon: CreditCard
          });
        });
    }

    // Insight: Top spending day
    if (data.currentPeriod.topExpenseDay) {
      insights.push({
        type: 'default',
        title: `Dia de maior gasto: ${data.currentPeriod.topExpenseDay.day}`,
        description: `Seu dia de maior gasto foi em ${data.currentPeriod.topExpenseDay.day} com R$ ${data.currentPeriod.topExpenseDay.amount.toFixed(2)}.`,
        icon: Calendar
      });
    }

    // Add a general insight if we don't have enough specific ones
    if (insights.length < 3) {
      if (data.currentPeriod.expense > data.currentPeriod.income) {
        insights.push({
          type: 'warning',
          title: 'Despesas maiores que receitas',
          description: `Suas despesas excederam suas receitas em R$ ${Math.abs(data.currentPeriod.balance).toFixed(2)} neste período.`,
          icon: AlertTriangle
        });
      } else if (data.currentPeriod.balance > 0) {
        insights.push({
          type: 'success',
          title: 'Saldo positivo no período',
          description: `Você economizou R$ ${data.currentPeriod.balance.toFixed(2)} neste período. Considere investir esta quantia.`,
          icon: TrendingUp
        });
      }
    }

    return insights;
  };

  const insights = generateInsights();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
          </svg>
          Insights Inteligentes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
            {insights.map((insight, index) => (
              <Alert key={index} variant={insight.type}>
                <insight.icon className={`h-4 w-4 ${
                  insight.type === 'success' 
                    ? 'text-green-600 dark:text-green-400' 
                    : insight.type === 'warning' 
                      ? 'text-amber-600 dark:text-amber-400' 
                      : insight.type === 'destructive'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-blue-600 dark:text-blue-400'
                }`} />
                <AlertTitle className="text-sm font-medium">{insight.title}</AlertTitle>
                <AlertDescription className="text-xs mt-1">
                  {insight.description}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <p>Não há dados suficientes para gerar insights. Tente visualizar um período maior.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 