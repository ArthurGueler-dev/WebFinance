'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { toast } from '@/components/ui/use-toast';

// Register ChartJS components
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

// Types
interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: 'INCOME' | 'EXPENSE';
  category: {
    id: string;
    name: string;
    color: string;
    icon?: string;
  };
  recurrenceType?: string;
  categoryId?: string;
}

interface MonthlyData {
  date: string;
  income: number;
  expense: number;
  categories: {
    [category: string]: number;
  };
}

export default function Reports() {
  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  
  // Date range state
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1)
      .toISOString()
      .split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  // Transactions state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);

  // Load data when component mounts or date range changes
  useEffect(() => {
    fetchTransactions();
  }, [dateRange.startDate, dateRange.endDate]);

  // Fetch transactions from API
  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/transactions?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to load transaction data');
      }
      
      const data = await response.json();
      setTransactions(data);
      
      // Process data for charts
      processTransactionsData(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load transaction data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Process transactions into monthly aggregated data
  const processTransactionsData = (transactions: Transaction[]) => {
    const monthlyMap = new Map<string, MonthlyData>();
    
    // Primeiro, processar transações para evitar duplicação de recorrentes
    const recurringTransactionsByMonth = new Map<string, Map<string, Transaction>>();
    const regularTransactions: Transaction[] = [];
    
    // Separar transações recorrentes e regulares
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      // Se é recorrente, processar especialmente
      if (transaction.recurrenceType === 'RECURRING') {
        if (!recurringTransactionsByMonth.has(monthKey)) {
          recurringTransactionsByMonth.set(monthKey, new Map<string, Transaction>());
        }
        
        const monthMap = recurringTransactionsByMonth.get(monthKey)!;
        const key = `${transaction.description}_${transaction.type}_${transaction.categoryId || ''}`;
        
        // Manter apenas a transação mais recente para cada mês/descrição/tipo
        if (!monthMap.has(key) || new Date(transaction.date) > new Date(monthMap.get(key)!.date)) {
          monthMap.set(key, transaction);
        }
      } else {
        // Transações normais são mantidas como estão
        regularTransactions.push(transaction);
      }
    });
    
    // Combinar transações regulares com uma instância de cada recorrente por mês
    const processedTransactions: Transaction[] = [...regularTransactions];
    recurringTransactionsByMonth.forEach(monthMap => {
      monthMap.forEach(transaction => {
        processedTransactions.push(transaction);
      });
    });
    
    // Agora processar as transações já tratadas por mês
    processedTransactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          date: monthKey,
          income: 0,
          expense: 0,
          categories: {}
        });
      }
      
      const monthData = monthlyMap.get(monthKey)!;
      
      if (transaction.type === 'INCOME') {
        monthData.income += transaction.amount;
      } else {
        // For expenses, amount is already stored as positive
        monthData.expense += transaction.amount;
        
        // Add to category breakdown
        const categoryName = transaction.category?.name || 'Uncategorized';
        if (!monthData.categories[categoryName]) {
          monthData.categories[categoryName] = 0;
        }
        monthData.categories[categoryName] += transaction.amount;
      }
    });
    
    // Convert map to array and sort by date
    const monthlyDataArray = Array.from(monthlyMap.values())
      .sort((a, b) => a.date.localeCompare(b.date));
      
    setMonthlyData(monthlyDataArray);
  };

  // Handle date range changes
  const handleDateRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateRange({
      ...dateRange,
      [name]: value,
    });
  };

  // Handle update button click
  const handleUpdateClick = () => {
    fetchTransactions();
  };

  // Prepare data for Income vs Expenses chart
  const incomeVsExpenseData = {
    labels: monthlyData.map((m) => {
      const [year, month] = m.date.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
    }),
    datasets: [
      {
        label: 'Income',
        data: monthlyData.map((m) => m.income),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
      {
        label: 'Expenses',
        data: monthlyData.map((m) => m.expense),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
      },
    ],
  };

  // Prepare data for Category Distribution chart
  const latestMonth = monthlyData.length > 0 ? monthlyData[monthlyData.length - 1] : null;
  
  const categoryDistributionData = latestMonth ? {
    labels: Object.keys(latestMonth.categories),
    datasets: [
      {
        data: Object.values(latestMonth.categories),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(201, 203, 207, 0.6)',
          'rgba(255, 99, 255, 0.6)',
          'rgba(54, 235, 162, 0.6)',
          'rgba(255, 255, 86, 0.6)',
        ],
        borderWidth: 1,
      },
    ],
  } : {
    labels: [],
    datasets: [{ data: [], backgroundColor: [], borderWidth: 1 }]
  };

  // Prepare data for Savings Trend chart
  const savingsTrendData = {
    labels: monthlyData.map((m) => {
      const [year, month] = m.date.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
    }),
    datasets: [
      {
        label: 'Savings',
        data: monthlyData.map((m) => m.income - m.expense),
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Calculate totals
  const totalIncome = monthlyData.reduce((sum, m) => sum + m.income, 0);
  const totalExpenses = monthlyData.reduce((sum, m) => sum + m.expense, 0);
  const totalSavings = totalIncome - totalExpenses;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-medium">Date Range</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:w-1/2">
          <div className="space-y-2">
            <label htmlFor="startDate" className="text-sm font-medium leading-none">
              Start Date
            </label>
            <Input
              id="startDate"
              name="startDate"
              type="date"
              value={dateRange.startDate}
              onChange={handleDateRangeChange}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="endDate" className="text-sm font-medium leading-none">
              End Date
            </label>
            <Input
              id="endDate"
              name="endDate"
              type="date"
              value={dateRange.endDate}
              onChange={handleDateRangeChange}
            />
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={handleUpdateClick} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Update Reports'}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <p className="text-lg text-muted-foreground">Loading report data...</p>
        </div>
      ) : monthlyData.length === 0 ? (
        <div className="flex items-center justify-center p-12 border rounded-xl">
          <p className="text-lg text-muted-foreground">No transaction data found for the selected period.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h3 className="text-lg font-medium mb-4">Income vs Expenses</h3>
              <div className="h-80">
                <Bar
                  data={incomeVsExpenseData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              </div>
            </div>
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h3 className="text-lg font-medium mb-4">Expense Distribution by Category</h3>
              <div className="h-80">
                {Object.keys(latestMonth?.categories || {}).length > 0 ? (
                  <Pie
                    data={categoryDistributionData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'right',
                        },
                      },
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No expense data for the period</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-medium mb-4">Savings Trend</h3>
            <div className="h-80">
              <Line
                data={savingsTrendData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h3 className="text-lg font-medium mb-2">Total Income</h3>
              <p className="text-3xl font-bold text-green-600">
                R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h3 className="text-lg font-medium mb-2">Total Expenses</h3>
              <p className="text-3xl font-bold text-red-600">
                R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h3 className="text-lg font-medium mb-2">Total Savings</h3>
              <p className="text-3xl font-bold text-primary">
                R$ {totalSavings.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 