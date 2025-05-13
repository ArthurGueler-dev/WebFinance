'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export type FilterOptions = {
  dateRange: {
    startDate: string;
    endDate: string;
    compareWithPrevious: boolean;
    comparisonType: 'previous-period' | 'previous-year' | 'custom';
    comparisonStartDate?: string;
    comparisonEndDate?: string;
  };
  categories: string[];
  transactionTypes: ('INCOME' | 'EXPENSE' | 'TRANSFER')[];
  paymentMethods: ('CASH' | 'CREDIT' | 'DEBIT' | 'FOOD_VOUCHER')[];
  accounts: string[];
  creditCards: string[];
  displayOptions: {
    groupBy: 'day' | 'week' | 'month' | 'quarter' | 'year';
    showAs: 'value' | 'percentage';
    separateVA: boolean;
    separateFixedVariable: boolean;
  };
};

interface AdvancedFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onApplyFilters: () => void;
  categories: Array<{id: string; name: string; type: 'INCOME' | 'EXPENSE'}>;
  accounts: Array<{id: string; name: string}>;
  creditCards: Array<{id: string; name: string}>;
}

export function AdvancedFilters({
  filters,
  onFiltersChange,
  onApplyFilters,
  categories,
  accounts,
  creditCards
}: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateDateRange = (field: string, value: string | boolean) => {
    onFiltersChange({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        [field]: value
      }
    });
  };

  const toggleCategory = (categoryId: string) => {
    const updatedCategories = filters.categories.includes(categoryId)
      ? filters.categories.filter(id => id !== categoryId)
      : [...filters.categories, categoryId];
    
    onFiltersChange({
      ...filters,
      categories: updatedCategories
    });
  };

  const toggleTransactionType = (type: 'INCOME' | 'EXPENSE' | 'TRANSFER') => {
    const updatedTypes = filters.transactionTypes.includes(type)
      ? filters.transactionTypes.filter(t => t !== type)
      : [...filters.transactionTypes, type];
    
    onFiltersChange({
      ...filters,
      transactionTypes: updatedTypes
    });
  };

  const togglePaymentMethod = (method: 'CASH' | 'CREDIT' | 'DEBIT' | 'FOOD_VOUCHER') => {
    const updatedMethods = filters.paymentMethods.includes(method)
      ? filters.paymentMethods.filter(m => m !== method)
      : [...filters.paymentMethods, method];
    
    onFiltersChange({
      ...filters,
      paymentMethods: updatedMethods
    });
  };

  const toggleAccount = (accountId: string) => {
    const updatedAccounts = filters.accounts.includes(accountId)
      ? filters.accounts.filter(id => id !== accountId)
      : [...filters.accounts, accountId];
    
    onFiltersChange({
      ...filters,
      accounts: updatedAccounts
    });
  };

  const toggleCreditCard = (cardId: string) => {
    const updatedCards = filters.creditCards.includes(cardId)
      ? filters.creditCards.filter(id => id !== cardId)
      : [...filters.creditCards, cardId];
    
    onFiltersChange({
      ...filters,
      creditCards: updatedCards
    });
  };

  const updateDisplayOption = (field: string, value: any) => {
    onFiltersChange({
      ...filters,
      displayOptions: {
        ...filters.displayOptions,
        [field]: value
      }
    });
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Filtros e Opções</CardTitle>
          <Button 
            variant="ghost" 
            onClick={() => setIsExpanded(!isExpanded)}
            size="sm"
          >
            {isExpanded ? 'Simplificar' : 'Mais Opções'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filtro Básico de Data */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data Inicial</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.dateRange.startDate}
                onChange={(e) => updateDateRange('startDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Data Final</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.dateRange.endDate}
                onChange={(e) => updateDateRange('endDate', e.target.value)}
              />
            </div>
          </div>

          {/* Filtros Avançados */}
          {isExpanded && (
            <Accordion type="single" collapsible className="w-full">
              {/* Comparação de Períodos */}
              <AccordionItem value="period-comparison">
                <AccordionTrigger>Comparar Períodos</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="compareWithPrevious" 
                        checked={filters.dateRange.compareWithPrevious}
                        onCheckedChange={(checked) => 
                          updateDateRange('compareWithPrevious', Boolean(checked))
                        }
                      />
                      <Label htmlFor="compareWithPrevious">Comparar com período anterior</Label>
                    </div>
                    
                    {filters.dateRange.compareWithPrevious && (
                      <div className="pt-2">
                        <Label htmlFor="comparisonType">Tipo de Comparação</Label>
                        <Select 
                          value={filters.dateRange.comparisonType}
                          onValueChange={(value) => 
                            updateDateRange('comparisonType', value as 'previous-period' | 'previous-year' | 'custom')
                          }
                        >
                          <SelectTrigger id="comparisonType" className="w-full">
                            <SelectValue placeholder="Selecione o tipo de comparação" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="previous-period">Período anterior (mesmo intervalo)</SelectItem>
                            <SelectItem value="previous-year">Mesmo período do ano anterior</SelectItem>
                            <SelectItem value="custom">Período personalizado</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {filters.dateRange.comparisonType === 'custom' && (
                          <div className="grid gap-4 sm:grid-cols-2 mt-3">
                            <div className="space-y-2">
                              <Label htmlFor="comparisonStartDate">Data Inicial Comparação</Label>
                              <Input
                                id="comparisonStartDate"
                                type="date"
                                value={filters.dateRange.comparisonStartDate || ''}
                                onChange={(e) => updateDateRange('comparisonStartDate', e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="comparisonEndDate">Data Final Comparação</Label>
                              <Input
                                id="comparisonEndDate"
                                type="date"
                                value={filters.dateRange.comparisonEndDate || ''}
                                onChange={(e) => updateDateRange('comparisonEndDate', e.target.value)}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              {/* Categorias */}
              <AccordionItem value="categories">
                <AccordionTrigger>Categorias</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    {categories.map(category => (
                      <div key={category.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`category-${category.id}`} 
                          checked={filters.categories.includes(category.id)}
                          onCheckedChange={() => toggleCategory(category.id)}
                        />
                        <Label 
                          htmlFor={`category-${category.id}`}
                          className={category.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}
                        >
                          {category.name}
                        </Label>
                      </div>
                    ))}
                    {categories.length === 0 && (
                      <p className="text-sm text-muted-foreground">Nenhuma categoria disponível</p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              {/* Tipo de Transação */}
              <AccordionItem value="transaction-types">
                <AccordionTrigger>Tipo de Transação</AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-wrap gap-4 pt-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="type-income" 
                        checked={filters.transactionTypes.includes('INCOME')}
                        onCheckedChange={() => toggleTransactionType('INCOME')}
                      />
                      <Label htmlFor="type-income" className="text-green-600">Receitas</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="type-expense" 
                        checked={filters.transactionTypes.includes('EXPENSE')}
                        onCheckedChange={() => toggleTransactionType('EXPENSE')}
                      />
                      <Label htmlFor="type-expense" className="text-red-600">Despesas</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="type-transfer" 
                        checked={filters.transactionTypes.includes('TRANSFER')}
                        onCheckedChange={() => toggleTransactionType('TRANSFER')}
                      />
                      <Label htmlFor="type-transfer" className="text-blue-600">Transferências</Label>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              {/* Método de Pagamento */}
              <AccordionItem value="payment-methods">
                <AccordionTrigger>Método de Pagamento</AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-wrap gap-4 pt-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="method-cash" 
                        checked={filters.paymentMethods.includes('CASH')}
                        onCheckedChange={() => togglePaymentMethod('CASH')}
                      />
                      <Label htmlFor="method-cash">Dinheiro</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="method-debit" 
                        checked={filters.paymentMethods.includes('DEBIT')}
                        onCheckedChange={() => togglePaymentMethod('DEBIT')}
                      />
                      <Label htmlFor="method-debit">Débito</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="method-credit" 
                        checked={filters.paymentMethods.includes('CREDIT')}
                        onCheckedChange={() => togglePaymentMethod('CREDIT')}
                      />
                      <Label htmlFor="method-credit">Crédito</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="method-va" 
                        checked={filters.paymentMethods.includes('FOOD_VOUCHER')}
                        onCheckedChange={() => togglePaymentMethod('FOOD_VOUCHER')}
                      />
                      <Label htmlFor="method-va" className="text-amber-600">Vale Alimentação</Label>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              {/* Contas e Cartões */}
              <AccordionItem value="accounts-cards">
                <AccordionTrigger>Contas e Cartões</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Contas Bancárias</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {accounts.map(account => (
                          <div key={account.id} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`account-${account.id}`} 
                              checked={filters.accounts.includes(account.id)}
                              onCheckedChange={() => toggleAccount(account.id)}
                            />
                            <Label htmlFor={`account-${account.id}`}>{account.name}</Label>
                          </div>
                        ))}
                        {accounts.length === 0 && (
                          <p className="text-sm text-muted-foreground">Nenhuma conta disponível</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Cartões</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {creditCards.map(card => (
                          <div key={card.id} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`card-${card.id}`} 
                              checked={filters.creditCards.includes(card.id)}
                              onCheckedChange={() => toggleCreditCard(card.id)}
                            />
                            <Label htmlFor={`card-${card.id}`}>{card.name}</Label>
                          </div>
                        ))}
                        {creditCards.length === 0 && (
                          <p className="text-sm text-muted-foreground">Nenhum cartão disponível</p>
                        )}
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              {/* Opções de Visualização */}
              <AccordionItem value="display-options">
                <AccordionTrigger>Opções de Visualização</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="groupBy">Agrupar por</Label>
                      <Select 
                        value={filters.displayOptions.groupBy}
                        onValueChange={(value) => 
                          updateDisplayOption('groupBy', value as 'day' | 'week' | 'month' | 'quarter' | 'year')
                        }
                      >
                        <SelectTrigger id="groupBy" className="w-full">
                          <SelectValue placeholder="Selecione o agrupamento" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="day">Por Dia</SelectItem>
                          <SelectItem value="week">Por Semana</SelectItem>
                          <SelectItem value="month">Por Mês</SelectItem>
                          <SelectItem value="quarter">Por Trimestre</SelectItem>
                          <SelectItem value="year">Por Ano</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="showAs">Exibir como</Label>
                      <Select 
                        value={filters.displayOptions.showAs}
                        onValueChange={(value) => 
                          updateDisplayOption('showAs', value as 'value' | 'percentage')
                        }
                      >
                        <SelectTrigger id="showAs" className="w-full">
                          <SelectValue placeholder="Selecione o formato" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="value">Valores</SelectItem>
                          <SelectItem value="percentage">Percentuais</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="separateVA" 
                          checked={filters.displayOptions.separateVA}
                          onCheckedChange={(checked) => 
                            updateDisplayOption('separateVA', Boolean(checked))
                          }
                        />
                        <Label htmlFor="separateVA">Separar Vale Alimentação do restante</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="separateFixedVariable" 
                          checked={filters.displayOptions.separateFixedVariable}
                          onCheckedChange={(checked) => 
                            updateDisplayOption('separateFixedVariable', Boolean(checked))
                          }
                        />
                        <Label htmlFor="separateFixedVariable">Separar despesas fixas e variáveis</Label>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
          
          <Button 
            className="w-full mt-4"
            onClick={onApplyFilters}
          >
            Aplicar Filtros
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 